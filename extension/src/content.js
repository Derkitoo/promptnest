// PromptNest Content Script for direct AI prompt injection on ChatGPT, Claude, DeepSeek, Gemini

(function () {
  if (window.__promptnest_injected) return;
  window.__promptnest_injected = true;

  let isPaletteOpen = false;
  let cachedPrompts = [];

  // Create Floating Action Button
  const fab = document.createElement("button");
  fab.id = "promptnest-fab";
  fab.innerHTML = "⚡ <span>PromptNest</span>";
  fab.title = "Ouvrir PromptNest (Ctrl+Shift+K)";
  document.body.appendChild(fab);

  // Create Palette Modal
  const palette = document.createElement("div");
  palette.id = "promptnest-palette";
  palette.className = "promptnest-hidden";
  palette.innerHTML = `
    <div class="pn-header">
      <strong>⚡ PromptNest Quick Inject</strong>
      <button id="pn-close">&times;</button>
    </div>
    <div class="pn-search">
      <input type="text" id="pn-input" placeholder="Rechercher un prompt..." />
    </div>
    <div class="pn-list" id="pn-list">
      <div class="pn-empty">Chargement des prompts...</div>
    </div>
    <div class="pn-runner promptnest-hidden" id="pn-runner">
      <div class="pn-runner-title" id="pn-runner-title">Remplir les variables</div>
      <div id="pn-runner-fields"></div>
      <div class="pn-runner-actions">
        <button id="pn-runner-back" class="pn-btn-sec">Retour</button>
        <button id="pn-runner-inject" class="pn-btn-pri">Injecter dans le Chat ↵</button>
      </div>
    </div>
  `;
  document.body.appendChild(palette);

  // Load prompts from storage or Supabase fallback
  async function loadPrompts() {
    try {
      const storage = await chrome.storage.local.get(null);
      let prompts = [];
      for (const k in storage) {
        if (k.includes("promptnest") && Array.isArray(storage[k])) {
          prompts = storage[k];
          break;
        }
      }
      if (!prompts || prompts.length === 0) {
        // Fallback seed prompts if local cache empty
        prompts = [
          { id: "1", title: "Revue de code senior", content: "Tu es un lead engineer expérimenté.\n\nAnalyse le code suivant :\n\n{{code}}\n\nIdentifie les erreurs, risques et failles." },
          { id: "2", title: "Transformer en spécification", content: "Transforme {{idee}} en cahier des charges clair pour l'équipe {{equipe}}." },
          { id: "3", title: "Débogage méthodique", content: "Aide-moi à isoler la cause racine de cette erreur : {{erreur}}" }
        ];
      }
      cachedPrompts = prompts;
      renderList(cachedPrompts);
    } catch (e) {
      console.warn("[PromptNest] Err load prompts:", e);
    }
  }

  function renderList(list) {
    const container = palette.querySelector("#pn-list");
    if (!list || list.length === 0) {
      container.innerHTML = '<div class="pn-empty">Aucun prompt trouvé.</div>';
      return;
    }
    container.innerHTML = list
      .map(
        (p) => `
      <div class="pn-item" data-id="${p.id}">
        <strong>${escapeHtml(p.title)}</strong>
        <small>${escapeHtml(p.content.slice(0, 70))}...</small>
      </div>
    `
      )
      .join("");

    container.querySelectorAll(".pn-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        const prompt = cachedPrompts.find((x) => x.id === id);
        if (prompt) selectPrompt(prompt);
      });
    });
  }

  let selectedPrompt = null;
  let varValues = {};

  function extractVars(text) {
    return [...new Set([...text.matchAll(/{{\s*([\w.-]+)\s*}}/g)].map((m) => m[1]))];
  }

  function renderText(text, values) {
    return text.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key) => values[key] ?? `{{${key}}}`);
  }

  function selectPrompt(prompt) {
    selectedPrompt = prompt;
    const vars = extractVars(prompt.content);
    if (vars.length > 0) {
      // Show runner
      palette.querySelector("#pn-list").classList.add("promptnest-hidden");
      const runner = palette.querySelector("#pn-runner");
      runner.classList.remove("promptnest-hidden");
      palette.querySelector("#pn-runner-title").textContent = `Variables pour "${prompt.title}"`;

      const fieldsContainer = palette.querySelector("#pn-runner-fields");
      fieldsContainer.innerHTML = vars
        .map(
          (v) => `
        <div class="pn-field">
          <label>${escapeHtml(v)}</label>
          <input type="text" data-var="${escapeHtml(v)}" placeholder="Saisir ${escapeHtml(v)}..." />
        </div>
      `
        )
        .join("");

      varValues = {};
    } else {
      injectTextIntoChat(prompt.content);
      togglePalette(false);
    }
  }

  function injectTextIntoChat(text) {
    // Find active chat input for ChatGPT, Claude, DeepSeek, Gemini
    const selectors = [
      "#prompt-textarea",
      "div[contenteditable='true']",
      "textarea[data-id='root']",
      "textarea#chat-input",
      "textarea",
      ".ProseMirror"
    ];

    let target = null;
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && isElementVisible(el)) {
        target = el;
        break;
      }
    }

    if (!target) {
      alert("[PromptNest] Impossible de trouver le champ de saisie du chat.");
      return;
    }

    target.focus();
    if (target.tagName.toLowerCase() === "textarea" || target.tagName.toLowerCase() === "input") {
      target.value = text;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (target.isContentEditable) {
      target.innerText = text;
      target.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function isElementVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  function togglePalette(open) {
    isPaletteOpen = open !== undefined ? open : !isPaletteOpen;
    if (isPaletteOpen) {
      palette.classList.remove("promptnest-hidden");
      loadPrompts();
      const input = palette.querySelector("#pn-input");
      setTimeout(() => input?.focus(), 100);
    } else {
      palette.classList.add("promptnest-hidden");
      palette.querySelector("#pn-list").classList.remove("promptnest-hidden");
      palette.querySelector("#pn-runner").classList.add("promptnest-hidden");
    }
  }

  // Load saved position
  try {
    chrome.storage.local.get("promptnest.fab_pos", (res) => {
      if (res && res["promptnest.fab_pos"]) {
        const pos = res["promptnest.fab_pos"];
        fab.style.left = `${pos.left}px`;
        fab.style.top = `${pos.top}px`;
        fab.style.bottom = "auto";
        fab.style.right = "auto";
      }
    });
  } catch (e) {}

  // Drag & drop logic
  fab.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = fab.getBoundingClientRect();
    const initLeft = rect.left;
    const initTop = rect.top;
    let hasMoved = false;

    const onMouseMove = (moveEvt) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMoved = true;
      }
      const newLeft = Math.max(10, Math.min(window.innerWidth - 160, initLeft + dx));
      const newTop = Math.max(10, Math.min(window.innerHeight - 50, initTop + dy));
      fab.style.left = `${newLeft}px`;
      fab.style.top = `${newTop}px`;
      fab.style.bottom = "auto";
      fab.style.right = "auto";
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (hasMoved) {
        const rectAfter = fab.getBoundingClientRect();
        try {
          chrome.storage.local.set({ "promptnest.fab_pos": { left: rectAfter.left, top: rectAfter.top } });
        } catch (e) {}
      } else {
        togglePalette();
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  });

  palette.querySelector("#pn-close").addEventListener("click", () => togglePalette(false));


  palette.querySelector("#pn-input").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = cachedPrompts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
    );
    renderList(filtered);
  });

  palette.querySelector("#pn-runner-back").addEventListener("click", () => {
    palette.querySelector("#pn-list").classList.remove("promptnest-hidden");
    palette.querySelector("#pn-runner").classList.add("promptnest-hidden");
  });

  palette.querySelector("#pn-runner-inject").addEventListener("click", () => {
    palette.querySelectorAll("#pn-runner-fields input").forEach((inp) => {
      const v = inp.getAttribute("data-var");
      if (v) varValues[v] = inp.value;
    });
    const finalText = renderText(selectedPrompt.content, varValues);
    injectTextIntoChat(finalText);
    togglePalette(false);
  });

  // Keyboard shortcut Ctrl+Shift+K / Cmd+Shift+K
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      togglePalette();
    }
  });
})();
