(function(){(function(){if(window.__promptnest_injected)return;window.__promptnest_injected=!0;let v=!1,d=[];const r=document.createElement("button");r.id="promptnest-fab",r.innerHTML="⚡ <span>PromptNest</span>",r.title="Ouvrir PromptNest (Ctrl+Shift+K)",document.body.appendChild(r);const s=document.createElement("div");s.id="promptnest-palette",s.className="promptnest-hidden",s.innerHTML=`
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
  `,document.body.appendChild(s);async function x(){try{const e=await chrome.storage.local.get(null);let t=[];for(const n in e)if(n.includes("promptnest")&&Array.isArray(e[n])){t=e[n];break}(!t||t.length===0)&&(t=[{id:"1",title:"Revue de code senior",content:`Tu es un lead engineer expérimenté.

Analyse le code suivant :

{{code}}

Identifie les erreurs, risques et failles.`},{id:"2",title:"Transformer en spécification",content:"Transforme {{idee}} en cahier des charges clair pour l'équipe {{equipe}}."},{id:"3",title:"Débogage méthodique",content:"Aide-moi à isoler la cause racine de cette erreur : {{erreur}}"}]),d=t,L(d)}catch(e){console.warn("[PromptNest] Err load prompts:",e)}}function L(e){const t=s.querySelector("#pn-list");if(!e||e.length===0){t.innerHTML='<div class="pn-empty">Aucun prompt trouvé.</div>';return}t.innerHTML=e.map(n=>`
      <div class="pn-item" data-id="${n.id}">
        <strong>${p(n.title)}</strong>
        <small>${p(n.content.slice(0,70))}...</small>
      </div>
    `).join(""),t.querySelectorAll(".pn-item").forEach(n=>{n.addEventListener("click",()=>{const i=n.getAttribute("data-id"),a=d.find(l=>l.id===i);a&&g(a)})})}let w=null,y={};function C(e){return[...new Set([...e.matchAll(/{{\s*([\w.-]+)\s*}}/g)].map(t=>t[1]))]}function S(e,t){return e.replace(/{{\s*([\w.-]+)\s*}}/g,(n,i)=>t[i]??`{{${i}}}`)}function g(e){w=e;const t=C(e.content);if(t.length>0){s.querySelector("#pn-list").classList.add("promptnest-hidden"),s.querySelector("#pn-runner").classList.remove("promptnest-hidden"),s.querySelector("#pn-runner-title").textContent=`Variables pour "${e.title}"`;const n=s.querySelector("#pn-runner-fields");n.innerHTML=t.map(i=>`
        <div class="pn-field">
          <label>${p(i)}</label>
          <input type="text" data-var="${p(i)}" placeholder="Saisir ${p(i)}..." />
        </div>
      `).join(""),y={}}else E(e.content),f(!1)}function E(e){const t=["#prompt-textarea","div[contenteditable='true']","textarea[data-id='root']","textarea#chat-input","textarea",".ProseMirror"];let n=null;for(const i of t){const a=document.querySelector(i);if(a&&M(a)){n=a;break}}if(!n){alert("[PromptNest] Impossible de trouver le champ de saisie du chat.");return}n.focus(),n.tagName.toLowerCase()==="textarea"||n.tagName.toLowerCase()==="input"?(n.value=e,n.dispatchEvent(new Event("input",{bubbles:!0})),n.dispatchEvent(new Event("change",{bubbles:!0}))):n.isContentEditable&&(n.innerText=e,n.dispatchEvent(new Event("input",{bubbles:!0})))}function M(e){return!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)}function p(e){return String(e).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function f(e){if(v=e!==void 0?e:!v,v){s.classList.remove("promptnest-hidden"),x();const t=s.querySelector("#pn-input");setTimeout(()=>t?.focus(),100)}else s.classList.add("promptnest-hidden"),s.querySelector("#pn-list").classList.remove("promptnest-hidden"),s.querySelector("#pn-runner").classList.add("promptnest-hidden")}try{chrome.storage.local.get("promptnest.fab_pos",e=>{if(e&&e["promptnest.fab_pos"]){const t=e["promptnest.fab_pos"];r.style.left=`${t.left}px`,r.style.top=`${t.top}px`,r.style.bottom="auto",r.style.right="auto"}})}catch{}r.addEventListener("mousedown",e=>{if(e.button!==0)return;const t=e.clientX,n=e.clientY,i=r.getBoundingClientRect(),a=i.left,l=i.top;let c=!1;const m=u=>{const b=u.clientX-t,q=u.clientY-n;(Math.abs(b)>4||Math.abs(q)>4)&&(c=!0);const T=Math.max(10,Math.min(window.innerWidth-160,a+b)),k=Math.max(10,Math.min(window.innerHeight-50,l+q));r.style.left=`${T}px`,r.style.top=`${k}px`,r.style.bottom="auto",r.style.right="auto"},h=()=>{if(window.removeEventListener("mousemove",m),window.removeEventListener("mouseup",h),c){const u=r.getBoundingClientRect();try{chrome.storage.local.set({"promptnest.fab_pos":{left:u.left,top:u.top}})}catch{}}else f()};window.addEventListener("mousemove",m),window.addEventListener("mouseup",h)}),s.querySelector("#pn-close").addEventListener("click",()=>f(!1)),s.querySelector("#pn-input").addEventListener("input",e=>{const t=e.target.value.toLowerCase();L(d.filter(n=>n.title.toLowerCase().includes(t)||n.content.toLowerCase().includes(t)))}),s.querySelector("#pn-runner-back").addEventListener("click",()=>{s.querySelector("#pn-list").classList.remove("promptnest-hidden"),s.querySelector("#pn-runner").classList.add("promptnest-hidden")}),s.querySelector("#pn-runner-inject").addEventListener("click",()=>{s.querySelectorAll("#pn-runner-fields input").forEach(e=>{const t=e.getAttribute("data-var");t&&(y[t]=e.value)}),E(S(w.content,y)),f(!1)});const o=document.createElement("div");o.id="promptnest-slash-menu",o.className="promptnest-hidden",document.body.appendChild(o),document.addEventListener("keyup",e=>{const t=e.target;if(!t||!(t.tagName==="TEXTAREA"||t.tagName==="INPUT"||t.isContentEditable))return;const n=t.value||t.innerText||"";if(n.startsWith("/")){const i=n.slice(1).toLowerCase(),a=d.filter(l=>l.title.toLowerCase().includes(i)||l.category&&l.category.toLowerCase().includes(i));if(a.length>0){const l=t.getBoundingClientRect();o.style.left=`${Math.max(10,l.left)}px`,o.style.top=`${Math.max(10,l.top-180)}px`,o.innerHTML=a.map((c,m)=>`
          <div class="pn-slash-item ${m===0?"active":""}" data-id="${c.id}">
            <strong>/${p(c.title)}</strong>
            <small>${p(c.content.slice(0,50))}...</small>
          </div>
        `).join(""),o.classList.remove("promptnest-hidden"),o.querySelectorAll(".pn-slash-item").forEach(c=>{c.addEventListener("click",()=>{const m=c.getAttribute("data-id"),h=d.find(u=>u.id===m);h&&(g(h),o.classList.add("promptnest-hidden"))})})}else o.classList.add("promptnest-hidden")}else o.classList.add("promptnest-hidden")}),document.addEventListener("keydown",e=>{if(!o.classList.contains("promptnest-hidden")&&(e.key==="Enter"||e.key==="Tab")){const t=o.querySelector(".pn-slash-item.active");if(t){e.preventDefault();const n=t.getAttribute("data-id"),i=d.find(a=>a.id===n);i&&(g(i),o.classList.add("promptnest-hidden"))}}else e.key==="Escape"&&o.classList.add("promptnest-hidden")}),document.addEventListener("keydown",e=>{(e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==="k"&&(e.preventDefault(),f())})})()})();
