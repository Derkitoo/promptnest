(function(){(function(){if(window.__promptnest_injected)return;window.__promptnest_injected=!0;let d=!1,c=[];const o=document.createElement("button");o.id="promptnest-fab",o.innerHTML="⚡ <span>PromptNest</span>",o.title="Ouvrir PromptNest (Ctrl+Shift+K)",document.body.appendChild(o);const r=document.createElement("div");r.id="promptnest-palette",r.className="promptnest-hidden",r.innerHTML=`
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
  `,document.body.appendChild(r);async function v(){try{const e=await chrome.storage.local.get(null);let t=[];for(const n in e)if(n.includes("promptnest")&&Array.isArray(e[n])){t=e[n];break}(!t||t.length===0)&&(t=[{id:"1",title:"Revue de code senior",content:`Tu es un lead engineer expérimenté.

Analyse le code suivant :

{{code}}

Identifie les erreurs, risques et failles.`},{id:"2",title:"Transformer en spécification",content:"Transforme {{idee}} en cahier des charges clair pour l'équipe {{equipe}}."},{id:"3",title:"Débogage méthodique",content:"Aide-moi à isoler la cause racine de cette erreur : {{erreur}}"}]),c=t,u(c)}catch(e){console.warn("[PromptNest] Err load prompts:",e)}}function u(e){const t=r.querySelector("#pn-list");if(!e||e.length===0){t.innerHTML='<div class="pn-empty">Aucun prompt trouvé.</div>';return}t.innerHTML=e.map(n=>`
      <div class="pn-item" data-id="${n.id}">
        <strong>${a(n.title)}</strong>
        <small>${a(n.content.slice(0,70))}...</small>
      </div>
    `).join(""),t.querySelectorAll(".pn-item").forEach(n=>{n.addEventListener("click",()=>{const i=n.getAttribute("data-id"),s=c.find(L=>L.id===i);s&&g(s)})})}let m=null,p={};function h(e){return[...new Set([...e.matchAll(/{{\s*([\w.-]+)\s*}}/g)].map(t=>t[1]))]}function b(e,t){return e.replace(/{{\s*([\w.-]+)\s*}}/g,(n,i)=>t[i]??`{{${i}}}`)}function g(e){m=e;const t=h(e.content);if(t.length>0){r.querySelector("#pn-list").classList.add("promptnest-hidden"),r.querySelector("#pn-runner").classList.remove("promptnest-hidden"),r.querySelector("#pn-runner-title").textContent=`Variables pour "${e.title}"`;const n=r.querySelector("#pn-runner-fields");n.innerHTML=t.map(i=>`
        <div class="pn-field">
          <label>${a(i)}</label>
          <input type="text" data-var="${a(i)}" placeholder="Saisir ${a(i)}..." />
        </div>
      `).join(""),p={}}else f(e.content),l(!1)}function f(e){const t=["#prompt-textarea","div[contenteditable='true']","textarea[data-id='root']","textarea#chat-input","textarea",".ProseMirror"];let n=null;for(const i of t){const s=document.querySelector(i);if(s&&y(s)){n=s;break}}if(!n){alert("[PromptNest] Impossible de trouver le champ de saisie du chat.");return}n.focus(),n.tagName.toLowerCase()==="textarea"||n.tagName.toLowerCase()==="input"?(n.value=e,n.dispatchEvent(new Event("input",{bubbles:!0})),n.dispatchEvent(new Event("change",{bubbles:!0}))):n.isContentEditable&&(n.innerText=e,n.dispatchEvent(new Event("input",{bubbles:!0})))}function y(e){return!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)}function a(e){return String(e).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function l(e){if(d=e!==void 0?e:!d,d){r.classList.remove("promptnest-hidden"),v();const t=r.querySelector("#pn-input");setTimeout(()=>t?.focus(),100)}else r.classList.add("promptnest-hidden"),r.querySelector("#pn-list").classList.remove("promptnest-hidden"),r.querySelector("#pn-runner").classList.add("promptnest-hidden")}o.addEventListener("click",()=>l()),r.querySelector("#pn-close").addEventListener("click",()=>l(!1)),r.querySelector("#pn-input").addEventListener("input",e=>{const t=e.target.value.toLowerCase();u(c.filter(n=>n.title.toLowerCase().includes(t)||n.content.toLowerCase().includes(t)))}),r.querySelector("#pn-runner-back").addEventListener("click",()=>{r.querySelector("#pn-list").classList.remove("promptnest-hidden"),r.querySelector("#pn-runner").classList.add("promptnest-hidden")}),r.querySelector("#pn-runner-inject").addEventListener("click",()=>{r.querySelectorAll("#pn-runner-fields input").forEach(e=>{const t=e.getAttribute("data-var");t&&(p[t]=e.value)}),f(b(m.content,p)),l(!1)}),document.addEventListener("keydown",e=>{(e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==="k"&&(e.preventDefault(),l())})})()})();
