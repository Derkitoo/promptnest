"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { TEMPLATE_LIBRARY, PromptTemplate } from "../lib/prompt-templates";
import { extractVariables, renderPrompt, createRevision, rollbackRevision } from "../packages/shared/prompt-core.mjs";

export type Revision = {
  id: string;
  promptId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  collectionId?: string | null;
  createdAt: string;
  note?: string;
};

export type Prompt = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  favorite: boolean;
  archived: boolean;
  updatedAt: string;
  usageCount: number;
  collectionId?: string | null;
  revisions?: Revision[];
};

export type Collection = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: "col-dev", name: "Développement", color: "#3b82f6", icon: "💻" },
  { id: "col-prod", name: "Produit & Specs", color: "#10b981", icon: "🚀" },
  { id: "col-copy", name: "Copywriting & Marketing", color: "#f59e0b", icon: "✍️" },
];

const seed: Prompt[] = [
  {
    id: "1",
    title: "Revue de code senior",
    content: "Tu es un lead engineer expérimenté.\n\nAnalyse le code suivant en {{langage}} :\n\n{{code}}\n\nIdentifie les erreurs, risques, problèmes de performance et failles de sécurité. Propose ensuite une version corrigée.",
    category: "Développement",
    tags: ["code", "review"],
    favorite: true,
    archived: false,
    updatedAt: new Date().toISOString(),
    usageCount: 8,
    collectionId: "col-dev",
    revisions: []
  },
  {
    id: "2",
    title: "Transformer une idée en spécification",
    content: "Transforme {{idee}} en cahier des charges clair pour une équipe {{equipe}}.",
    category: "Produit",
    tags: ["spécification"],
    favorite: false,
    archived: false,
    updatedAt: "2026-08-15T10:00:00Z",
    usageCount: 3,
    collectionId: "col-prod",
    revisions: []
  },
  {
    id: "3",
    title: "Débogage méthodique",
    content: "Aide-moi à isoler la cause racine de cette erreur : {{erreur}}",
    category: "Développement",
    tags: ["debug"],
    favorite: false,
    archived: false,
    updatedAt: "2026-08-12T10:00:00Z",
    usageCount: 5,
    collectionId: "col-dev",
    revisions: []
  }
];

const KEY = "promptvault.prompts.v1";
const KEY_COLLECTIONS = "promptvault.collections.v1";

export default function PromptVaultApp() {
  const [items, setItems] = useState<Prompt[]>(() => {
    if (typeof window === "undefined") return seed;
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? JSON.parse(saved) : seed;
    } catch {
      return seed;
    }
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    if (typeof window === "undefined") return DEFAULT_COLLECTIONS;
    try {
      const saved = localStorage.getItem(KEY_COLLECTIONS);
      return saved ? JSON.parse(saved) : DEFAULT_COLLECTIONS;
    } catch {
      return DEFAULT_COLLECTIONS;
    }
  });

  const [selected, setSelected] = useState("1");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("all"); // 'all' | 'favorites' | 'archive' | collectionId
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState(false);

  // Modals state
  const [showGallery, setShowGallery] = useState(false);
  const [showVarRunner, setShowVarRunner] = useState(false);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"edit" | "history">("edit");
  const [newColName, setNewColName] = useState("");
  const [showAddCol, setShowAddCol] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState("");
  const [syncState, setSyncState] = useState("Mode local");
  const searchRef = useRef<HTMLInputElement>(null);

  const [fabPos, setFabPos] = useState<{ left: number; top: number } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("promptvault.fab_pos");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleFabMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    const initLeft = rect.left;
    const initTop = rect.top;
    let hasMoved = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMoved = true;
      }
      const newLeft = Math.max(10, Math.min(window.innerWidth - 180, initLeft + dx));
      const newTop = Math.max(10, Math.min(window.innerHeight - 60, initTop + dy));
      setFabPos({ left: newLeft, top: newTop });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (hasMoved) {
        setFabPos((pos) => {
          if (pos) localStorage.setItem("promptvault.fab_pos", JSON.stringify(pos));
          return pos;
        });
      } else {
        handleCopyRequest();
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };


  useEffect(() => localStorage.setItem(KEY, JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem(KEY_COLLECTIONS, JSON.stringify(collections)), [collections]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setUserEmail(data.session?.user.email ?? "");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? "");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const refresh = async () => {
      setSyncState("Synchronisation…");
      const { data, error } = await supabase.from("prompts").select("*").order("updated_at", { ascending: false });
      if (error) {
        setSyncState("Configuration Supabase requise");
        return;
      }
      const cloud: Prompt[] = (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category_name,
        tags: row.tags ?? [],
        favorite: row.is_favorite,
        archived: row.is_archived,
        usageCount: row.usage_count,
        updatedAt: row.updated_at,
        collectionId: row.collection_id ?? null,
      }));
      setItems((local) => {
        const merged = new Map(local.map((p) => [p.id, p]));
        for (const p of cloud) {
          const old = merged.get(p.id);
          if (!old || new Date(p.updatedAt) > new Date(old.updatedAt)) merged.set(p.id, p);
        }
        return [...merged.values()];
      });
      setSyncState("Synchronisé");
    };
    void refresh();
    const channel = supabase
      .channel(`prompts-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "prompts", filter: `user_id=eq.${userId}` }, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const current = items.find((p) => p.id === selected) ?? items[0];

  const visible = useMemo(() => {
    return items.filter((p) => {
      if (view === "archive") return p.archived;
      if (p.archived) return false;
      if (view === "favorites" && !p.favorite) return false;
      if (view.startsWith("col-") && p.collectionId !== view) return false;
      const q = query.toLowerCase();
      return `${p.title} ${p.content} ${p.tags.join(" ")}`.toLowerCase().includes(q);
    });
  }, [items, query, view]);

  const update = (patch: Partial<Prompt>) => {
    setItems((x) =>
      x.map((p) => {
        if (p.id !== selected) return p;
        const revs = p.revisions ? [...p.revisions] : [];
        if (patch.content !== undefined && patch.content !== p.content) {
          revs.unshift(createRevision(p, "Modifié dans l'éditeur"));
        }
        return { ...p, ...patch, revisions: revs, updatedAt: new Date().toISOString() };
      })
    );
  };

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2000);
  };

  const add = () => {
    const p: Prompt = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: "Nouveau prompt",
      content: "Écrivez votre prompt ici avec des variables {{ variable }}…",
      category: "Général",
      tags: [],
      favorite: false,
      archived: false,
      usageCount: 0,
      updatedAt: new Date().toISOString(),
      collectionId: view.startsWith("col-") ? view : null,
      revisions: []
    };
    setItems((x) => [p, ...x]);
    setSelected(p.id);
    setEditing(true);
  };

  const handleCopyRequest = () => {
    if (!current) return;
    const vars = extractVariables(current.content);
    if (vars.length > 0) {
      const initial: Record<string, string> = {};
      vars.forEach((v) => (initial[v] = varValues[v] || ""));
      setVarValues(initial);
      setShowVarRunner(true);
    } else {
      void copyDirect(current.content);
    }
  };

  const copyDirect = async (text: string) => {
    await navigator.clipboard.writeText(text);
    update({ usageCount: current.usageCount + 1 });
    notify("Prompt copié dans le presse-papier !");
    setShowVarRunner(false);
  };

  const save = async () => {
    localStorage.setItem(KEY, JSON.stringify(items));
    if (userId) {
      setSyncState("Synchronisation…");
      const rows = items
        .filter((p) => /^[0-9a-f-]{36}$/i.test(p.id))
        .map((p) => ({
          id: p.id,
          user_id: userId,
          title: p.title,
          content: p.content,
          category_name: p.category,
          tags: p.tags,
          is_favorite: p.favorite,
          is_archived: p.archived,
          usage_count: p.usageCount,
          updated_at: p.updatedAt,
          client_updated_at: p.updatedAt,
          collection_id: p.collectionId ?? null,
        }));
      const { error } = await supabase.from("prompts").upsert(rows);
      setSyncState(error ? "Erreur de synchronisation" : "Synchronisé");
    }
    setView("all");
    setQuery("");
    setEditing(false);
    notify(userId ? "Prompt enregistré et synchronisé" : "Prompt enregistré sur cet appareil");
  };

  const importTemplate = (tpl: PromptTemplate) => {
    const p: Prompt = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: tpl.title,
      content: tpl.content,
      category: tpl.category,
      tags: [...tpl.tags],
      favorite: false,
      archived: false,
      usageCount: 0,
      updatedAt: new Date().toISOString(),
      collectionId: null,
      revisions: []
    };
    setItems((x) => [p, ...x]);
    setSelected(p.id);
    setShowGallery(false);
    setEditing(true);
    notify(`Modèle "${tpl.title}" ajouté à votre vault !`);
  };

  const createCollection = () => {
    if (!newColName.trim()) return;
    const col: Collection = {
      id: `col-${Date.now()}`,
      name: newColName.trim(),
      color: "#6366f1",
      icon: "📁"
    };
    setCollections((prev) => [...prev, col]);
    setNewColName("");
    setShowAddCol(false);
    notify(`Collection "${col.name}" créée !`);
  };

  const handleRollback = (rev: Revision) => {
    if (!current) return;
    const restored = rollbackRevision(current, rev);
    update(restored);
    notify("Version antérieure restaurée !");
  };

  const signIn = () => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}${location.pathname}` } });
  const signOut = () => supabase.auth.signOut();
  const openPrompt = (id: string) => {
    setSelected(id);
    setEditing(true);
  };

  const exportData = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ prompts: items, collections }, null, 2)], { type: "application/json" }));
    a.download = "promptvault-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        add();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleCopyRequest();
      }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  if (!current) return null;
  const currentVars = extractVariables(current.content);

  return (
    <main className="app-shell">
      {toast && <div className="toast">✓ {toast}</div>}

      {/* Backdrop mobile pour le tiroir de navigation */}
      {mobileDrawerOpen && <div className="sidebar-backdrop" onClick={() => setMobileDrawerOpen(false)} />}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileDrawerOpen ? "mobile-drawer-open" : ""}`}>
        <div className="brand" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="brand-mark">P</span>
            <span>PromptNest</span>
          </div>
          {mobileDrawerOpen && (
            <button style={{ color: "#fff", fontSize: "20px" }} onClick={() => setMobileDrawerOpen(false)}>
              ×
            </button>
          )}
        </div>
        <button className="new-button" onClick={() => { add(); setMobileDrawerOpen(false); }}>
          ＋ Nouveau prompt
        </button>

        <nav>
          <button className={view === "all" ? "active" : ""} onClick={() => { setView("all"); setMobileDrawerOpen(false); }}>
            ▦ <span>Tous les prompts</span>
            <b>{items.filter((x) => !x.archived).length}</b>
          </button>
          <button className={view === "favorites" ? "active" : ""} onClick={() => { setView("favorites"); setMobileDrawerOpen(false); }}>
            ☆ <span>Favoris</span>
            <b>{items.filter((x) => x.favorite).length}</b>
          </button>
          <button className={view === "archive" ? "active" : ""} onClick={() => { setView("archive"); setMobileDrawerOpen(false); }}>
            ♢ <span>Archives</span>
          </button>

          <div className="section-title" style={{ padding: "10px 8px 4px", color: "#a8bcb1" }}>
            <span>COLLECTIONS</span>
            <button style={{ color: "#dff3ba", cursor: "pointer" }} onClick={() => setShowAddCol(!showAddCol)}>
              ＋
            </button>
          </div>

          {showAddCol && (
            <div style={{ padding: "0 8px 8px", display: "flex", gap: "4px" }}>
              <input
                style={{ flex: 1, background: "#244d3a", border: 0, borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                placeholder="Nom du dossier…"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createCollection()}
              />
              <button style={{ background: "#dff3ba", border: 0, borderRadius: "6px", color: "#183b2b", padding: "0 8px", fontWeight: "bold" }} onClick={createCollection}>
                OK
              </button>
            </div>
          )}

          {collections.map((col) => (
            <button key={col.id} className={view === col.id ? "active" : ""} onClick={() => { setView(col.id); setMobileDrawerOpen(false); }}>
              <span>{col.icon}</span>
              <span>{col.name}</span>
              <b>{items.filter((x) => !x.archived && x.collectionId === col.id).length}</b>
            </button>
          ))}
        </nav>

        <div className="sidebar-tools" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <button style={{ background: "#254a37", borderRadius: "8px", color: "#fff", cursor: "pointer" }} onClick={() => { setShowGallery(true); setMobileDrawerOpen(false); }}>
            ⚡ Galerie de Modèles (15+)
          </button>
          <button onClick={exportData}>⇩ Exporter JSON</button>
        </div>

        <div className="sidebar-foot">
          <span className="avatar">PN</span>
          <div>
            <strong>{userEmail || syncState}</strong>
            <small>● {syncState}</small>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <section className="workspace">
        <header className="app-header">

          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setMobileDrawerOpen(true)} title="Ouvrir les dossiers">
              ☰
            </button>
            <div>
              <p className="eyebrow">PROMPTNEST</p>
              <h1>
                {view === "favorites"
                  ? "Favoris"
                  : view === "archive"
                  ? "Archives"
                  : view.startsWith("col-")
                  ? collections.find((c) => c.id === view)?.name || "Collection"
                  : "Tous les prompts"}
              </h1>
              <p className="header-subtitle">Your best prompts, always within reach.</p>
            </div>
          </div>

          <div className="header-actions">
            <button className="btn-header-add" onClick={add} title="Nouveau prompt">
              ＋ <span className="text-hide-mobile">Nouveau</span>
            </button>
            {userId ? (
              <button className="btn-header-auth" onClick={signOut}>
                Déconnexion
              </button>
            ) : (
              <button className="btn-header-auth" onClick={signIn}>
                <b>G</b> <span className="text-hide-mobile">Connexion</span>
              </button>
            )}
            <span className="extension-pill">Extension ↗</span>
          </div>
        </header>



        <div className="toolbar">
          <label className="search">
            <span>⌕</span>
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un prompt, un tag…" />
            <kbd>⌘ K</kbd>
          </label>
          <button onClick={() => setShowGallery(true)}>⚡ Galerie de Modèles</button>
        </div>

        <div className="content-grid">
          {/* Prompt List */}
          <section className="prompt-list">
            <div className="list-meta">
              <span>{visible.length} PROMPTS</span>
              <span>DERNIÈRE MODIFICATION</span>
            </div>
            {visible.map((p, i) => {
              const col = collections.find((c) => c.id === p.collectionId);
              return (
                <button className={`prompt-card ${p.id === selected ? "selected" : ""}`} key={p.id} onClick={() => openPrompt(p.id)}>
                  <span className={`icon ${i % 2 ? "orange" : ""}`}>⌘</span>
                  <span className="card-copy">
                    <strong>{p.title}</strong>
                    <small className="summary">{p.content}</small>
                    {col && <span className="badge-collection">{col.icon} {col.name}</span>}
                    <span className="tag">{p.category}</span>
                    <small>{new Date(p.updatedAt).toLocaleDateString("fr-FR")}</small>
                  </span>
                  <span className="star">{p.favorite ? "★" : "☆"}</span>
                </button>
              );
            })}
          </section>

          {/* Prompt Editor */}
          <aside className={`editor ${editing ? "mobile-open" : ""}`}>
            <div className="editor-top">
              <span className="status-dot" /> Enregistrement automatique
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => setActiveTab(activeTab === "edit" ? "history" : "edit")}>
                  {activeTab === "edit" ? "📜 Historique" : "✏️ Éditeur"}
                </button>
                <button onClick={() => update({ favorite: !current.favorite })}>{current.favorite ? "★" : "☆"}</button>
                <button onClick={() => update({ archived: !current.archived })}>{current.archived ? "Restaurer" : "Archiver"}</button>
                <button className="mobile-close" onClick={() => setEditing(false)} aria-label="Fermer l’éditeur">
                  ×
                </button>
              </div>
            </div>

            {activeTab === "edit" ? (
              <>
                <label>
                  TITRE
                  <input value={current.title} onChange={(e) => update({ title: e.target.value })} />
                </label>

                <div className="field-label">
                  PROMPT{" "}
                  <button onClick={() => currentVars.length > 0 && setShowVarRunner(true)}>
                    Variables&nbsp; {"{{ }}"} ({currentVars.length})
                  </button>
                </div>
                <textarea className="prompt-editor" value={current.content} onChange={(e) => update({ content: e.target.value })} />

                {currentVars.length > 0 && (
                  <div className="var-chips-row">
                    <span style={{ fontSize: "10px", color: "#666", alignSelf: "center", fontWeight: "bold" }}>VARIABLES :</span>
                    {currentVars.map((v) => (
                      <span
                        key={v}
                        className="var-chip"
                        onClick={() => {
                          setVarValues({ ...varValues, [v]: "" });
                          setShowVarRunner(true);
                        }}
                      >
                        {"{{"} {v} {"}}"}
                      </span>
                    ))}
                  </div>
                )}

                <div className="editor-status-bar">
                  <span>{current.content.length} caractères • {current.content.trim().split(/\s+/).filter(Boolean).length} mots</span>
                  <button
                    style={{ border: 0, background: "transparent", fontSize: "10px", color: "#315b43", cursor: "pointer", fontWeight: "bold" }}
                    onClick={() => update({ content: current.content + " {{nouvelle_variable}}" })}
                  >
                    ＋ Insérer variable
                  </button>
                </div>


                <div className="editor-fields">
                  <label>
                    CATÉGORIE
                    <input value={current.category} onChange={(e) => update({ category: e.target.value })} />
                  </label>
                  <label>
                    TAGS
                    <input
                      value={current.tags.join(", ")}
                      onChange={(e) => update({ tags: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                    />
                  </label>
                </div>

                <div style={{ marginTop: "12px" }}>
                  <label style={{ fontSize: "9px", color: "#858985", fontWeight: 700 }}>
                    COLLECTION / DOSSIER
                    <select
                      style={{ display: "block", width: "100%", marginTop: "6px", border: "1px solid var(--line)", borderRadius: "7px", padding: "8px", background: "#fff" }}
                      value={current.collectionId || ""}
                      onChange={(e) => update({ collectionId: e.target.value || null })}
                    >
                      <option value="">Aucune collection</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="editor-footer">
                  <button className="copy" onClick={handleCopyRequest}>
                    ⧉ {currentVars.length > 0 ? "Remplir & Copier" : "Copier"}
                  </button>
                  <button className="save" onClick={save}>
                    Enregistrer et afficher
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
                <h3 style={{ font: "18px Georgia", margin: "0" }}>Historique des Révisions</h3>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                  Consultez et restaurez une version précédente de ce prompt.
                </p>

                {(!current.revisions || current.revisions.length === 0) ? (
                  <p style={{ fontSize: "12px", color: "#888", fontStyle: "italic", marginTop: "20px" }}>
                    Aucune révision enregistrée pour l'instant. Les révisions se créent automatiquement lors des modifications.
                  </p>
                ) : (
                  <div className="revision-list">
                    {current.revisions.map((rev) => (
                      <div key={rev.id} className="revision-item">
                        <div>
                          <strong>{rev.title}</strong>
                          <small>{new Date(rev.createdAt).toLocaleString("fr-FR")}</small>
                          <p style={{ fontSize: "11px", color: "#555", margin: "4px 0 0", maxHeight: "40px", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {rev.content}
                          </p>
                        </div>
                        <button className="btn-secondary" onClick={() => handleRollback(rev)}>
                          Restaurer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* Modal: Runner de Variables */}
      {showVarRunner && (
        <div className="modal-overlay" onClick={() => setShowVarRunner(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Remplir les variables de prompt</h2>
              <button className="btn-secondary" onClick={() => setShowVarRunner(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "18px" }}>
                Renseignez les valeurs pour chaque variable `{"{{ ... }}"}` afin de générer le prompt final.
              </p>
              {currentVars.map((v) => (
                <div key={v} className="var-input-group">
                  <label>{v.toUpperCase()}</label>
                  {v.toLowerCase().includes("code") || v.toLowerCase().includes("erreur") || v.toLowerCase().includes("contexte") ? (
                    <textarea rows={4} value={varValues[v] || ""} onChange={(e) => setVarValues({ ...varValues, [v]: e.target.value })} placeholder={`Valeur pour {{${v}}}...`} />
                  ) : (
                    <input value={varValues[v] || ""} onChange={(e) => setVarValues({ ...varValues, [v]: e.target.value })} placeholder={`Valeur pour {{${v}}}...`} />
                  )}
                </div>
              ))}
              <div style={{ marginTop: "16px", padding: "12px", background: "#f5f7f4", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "10px", fontWeight: "bold", color: "#555" }}>APERÇU DU PROMPT RENDU :</span>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "11px", margin: "6px 0 0", color: "#183b2b" }}>
                  {renderPrompt(current.content, varValues)}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowVarRunner(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={() => copyDirect(renderPrompt(current.content, varValues))}>
                ⧉ Copier le prompt rendu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Galerie de Modèles */}
      {showGallery && (
        <div className="modal-overlay" onClick={() => setShowGallery(false)}>
          <div className="modal-card" style={{ maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚡ Galerie de Modèles de Prompts</h2>
              <button className="btn-secondary" onClick={() => setShowGallery(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="template-grid">
                {TEMPLATE_LIBRARY.map((tpl) => (
                  <div key={tpl.id} className="template-card" onClick={() => importTemplate(tpl)}>
                    <h3>{tpl.title}</h3>
                    <p>{tpl.description}</p>
                    <div className="tags-row">
                      <span className="tag">{tpl.category}</span>
                      {tpl.tags.map((t) => (
                        <span key={t} className="tag" style={{ background: "#f0f2ef", color: "#666" }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Barre de navigation basse pour écran mobile */}
      <div className="bottom-nav">
        <button className={view === "all" ? "active" : ""} onClick={() => { setView("all"); setMobileDrawerOpen(false); }}>
          <span>▦</span> Prompts
        </button>
        <button onClick={() => setMobileDrawerOpen(true)}>
          <span>📁</span> Dossiers
        </button>
        <button onClick={() => setShowGallery(true)}>
          <span>⚡</span> Modèles
        </button>
        <button onClick={add}>
          <span>＋</span> Nouveau
        </button>
      </div>

      {/* Floating Action Button Déplaçable à la souris */}
      <button
        className="fab-webapp"
        style={{
          position: "fixed",
          left: fabPos ? `${fabPos.left}px` : "auto",
          top: fabPos ? `${fabPos.top}px` : "auto",
          bottom: fabPos ? "auto" : "24px",
          right: fabPos ? "auto" : "24px",
          zIndex: 40,
          background: "#183b2b",
          color: "#fff",
          border: "1px solid #2e5b45",
          borderRadius: "30px",
          padding: "12px 20px",
          fontSize: "13px",
          fontWeight: 700,
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          userSelect: "none",
          touchAction: "none"
        }}
        onMouseDown={handleFabMouseDown}
        title="Glisser-déposer pour déplacer le bouton, ou cliquer pour remplir les variables"
      >
        <span>🖐️</span> ⚡ Remplir & Copier ({currentVars.length})
      </button>
    </main>
  );
}



