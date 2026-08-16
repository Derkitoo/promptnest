"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Prompt={id:string;title:string;content:string;category:string;tags:string[];favorite:boolean;archived:boolean;updatedAt:string;usageCount:number};
const seed:Prompt[]=[
 {id:"1",title:"Revue de code senior",content:"Tu es un lead engineer expérimenté.\n\nAnalyse le code suivant :\n\n{{code}}\n\nIdentifie les erreurs, risques, problèmes de performance et failles de sécurité. Propose ensuite une version corrigée.",category:"Développement",tags:["code","review"],favorite:true,archived:false,updatedAt:new Date().toISOString(),usageCount:8},
 {id:"2",title:"Transformer une idée en spécification",content:"Transforme {{idee}} en cahier des charges clair pour une équipe {{equipe}}.",category:"Produit",tags:["spécification"],favorite:false,archived:false,updatedAt:"2026-08-15T10:00:00Z",usageCount:3},
 {id:"3",title:"Débogage méthodique",content:"Aide-moi à isoler la cause racine de cette erreur : {{erreur}}",category:"Développement",tags:["debug"],favorite:false,archived:false,updatedAt:"2026-08-12T10:00:00Z",usageCount:5}
];
const KEY="promptvault.prompts.v1";

export default function PromptVaultApp(){
 const [items,setItems]=useState<Prompt[]>(()=>{if(typeof window==="undefined")return seed;try{const saved=localStorage.getItem(KEY);return saved?JSON.parse(saved):seed}catch{return seed}});
 const [selected,setSelected]=useState("1"),[query,setQuery]=useState(""),[view,setView]=useState("all"),[toast,setToast]=useState(""),[editing,setEditing]=useState(false);
 const searchRef=useRef<HTMLInputElement>(null);
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(items)),[items]);
 const current=items.find(p=>p.id===selected)??items[0];
 const visible=useMemo(()=>items.filter(p=>(view==="archive"?p.archived:!p.archived)&&(view!=="favorites"||p.favorite)&&`${p.title} ${p.content} ${p.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())),[items,query,view]);
 const update=(patch:Partial<Prompt>)=>setItems(x=>x.map(p=>p.id===selected?{...p,...patch,updatedAt:new Date().toISOString()}:p));
 const notify=(message:string)=>{setToast(message);setTimeout(()=>setToast(""),1800)};
 const add=()=>{const p={...seed[0],id:crypto.randomUUID(),title:"Nouveau prompt",content:"Écrivez votre prompt ici…",tags:[],favorite:false,usageCount:0,updatedAt:new Date().toISOString()};setItems(x=>[p,...x]);setSelected(p.id);setEditing(true)};
 const copy=async()=>{await navigator.clipboard.writeText(current.content);update({usageCount:current.usageCount+1});notify("Prompt copié")};
 const save=()=>{localStorage.setItem(KEY,JSON.stringify(items));setView("all");setQuery("");setEditing(false);notify("Prompt enregistré et visible dans la liste")};
 const openPrompt=(id:string)=>{setSelected(id);setEditing(true)};
 const exportData=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(items,null,2)],{type:"application/json"}));a.download="promptvault-export.json";a.click();URL.revokeObjectURL(a.href)};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();searchRef.current?.focus()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="n"){e.preventDefault();add()}if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();copy()}};addEventListener("keydown",key);return()=>removeEventListener("keydown",key)});
 if(!current)return null;
 return <main className="app-shell">
  {toast&&<div className="toast">✓ {toast}</div>}
  <aside className="sidebar"><div className="brand"><span className="brand-mark">P</span><span>PromptVault</span></div><button className="new-button" onClick={add}>＋ Nouveau prompt</button><nav><button className={view==="all"?"active":""} onClick={()=>setView("all")}>▦ <span>Tous les prompts</span><b>{items.filter(x=>!x.archived).length}</b></button><button className={view==="favorites"?"active":""} onClick={()=>setView("favorites")}>☆ <span>Favoris</span><b>{items.filter(x=>x.favorite).length}</b></button><button className={view==="archive"?"active":""} onClick={()=>setView("archive")}>♢ <span>Archives</span></button></nav><div className="sidebar-tools"><button onClick={exportData}>⇩ Exporter en JSON</button></div><div className="sidebar-foot"><span className="avatar">PV</span><div><strong>Mode local</strong><small>● Enregistrement automatique</small></div></div></aside>
  <section className="workspace"><header><div><p className="eyebrow">BIBLIOTHÈQUE</p><h1>{view==="favorites"?"Favoris":view==="archive"?"Archives":"Tous les prompts"}</h1><p>Retrouvez votre meilleur travail, exactement quand vous en avez besoin.</p></div><div className="header-actions"><button className="mobile-new" onClick={add}>＋ Nouveau prompt</button><span className="extension">Extension Chrome ↗</span></div></header>
   <div className="toolbar"><label className="search"><span>⌕</span><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un prompt, un tag…"/><kbd>⌘ K</kbd></label><button>Plus récent⌄</button></div>
   <div className="content-grid"><section className="prompt-list"><div className="list-meta"><span>{visible.length} PROMPTS</span><span>DERNIÈRE MODIFICATION</span></div>{visible.map((p,i)=><button className={`prompt-card ${p.id===selected?"selected":""}`} key={p.id} onClick={()=>openPrompt(p.id)}><span className={`icon ${i%2?"orange":""}`}>⌘</span><span className="card-copy"><strong>{p.title}</strong><small className="summary">{p.content}</small><span className="tag">{p.category}</span><small>{new Date(p.updatedAt).toLocaleDateString("fr-FR")}</small></span><span className="star">{p.favorite?"★":"☆"}</span></button>)}</section>
    <aside className={`editor ${editing?"mobile-open":""}`}><div className="editor-top"><span className="status-dot"/> Enregistrement automatique <div><button onClick={()=>update({favorite:!current.favorite})}>{current.favorite?"★":"☆"}</button><button onClick={()=>update({archived:!current.archived})}>{current.archived?"Restaurer":"Archiver"}</button><button className="mobile-close" onClick={()=>setEditing(false)} aria-label="Fermer l’éditeur">×</button></div></div><label>TITRE<input value={current.title} onChange={e=>update({title:e.target.value})}/></label><div className="field-label">PROMPT <button>Variables&nbsp; {"{{ }}"}</button></div><textarea className="prompt-editor" value={current.content} onChange={e=>update({content:e.target.value})}/><div className="editor-fields"><label>CATÉGORIE<input value={current.category} onChange={e=>update({category:e.target.value})}/></label><label>TAGS<input value={current.tags.join(", ")} onChange={e=>update({tags:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})}/></label></div><div className="editor-footer"><button className="copy" onClick={copy}>⧉ Copier</button><button className="save" onClick={save}>Enregistrer et afficher</button></div></aside>
   </div>
  </section>
 </main>
}
