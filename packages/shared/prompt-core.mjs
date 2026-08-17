export const extractVariables=(text)=>[...new Set([...text.matchAll(/{{\s*([\w.-]+)\s*}}/g)].map(m=>m[1]))];
export const renderPrompt=(text,values)=>text.replace(/{{\s*([\w.-]+)\s*}}/g,(_,key)=>String(values[key]??`{{${key}}}`));
export const validatePrompt=(value)=>({ok:typeof value?.title==="string"&&value.title.trim().length>0&&value.title.length<=160&&typeof value?.content==="string"&&value.content.trim().length>0&&value.content.length<=50000,errors:[]});
export const resolveConflict=(local,remote)=>new Date(local.updatedAt)>=new Date(remote.updatedAt)?local:remote;
export const inspectImport=(rows,existing=[])=>{const ids=new Set(existing.map(x=>x.id));return rows.reduce((r,x)=>{if(!validatePrompt(x).ok)r.invalid++;else if(ids.has(x.id))r.duplicates++;else{r.valid++;r.items.push(x)}return r},{valid:0,invalid:0,duplicates:0,items:[]});};
export const createRevision=(prompt,note="")=>({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),promptId:prompt.id,title:prompt.title,content:prompt.content,category:prompt.category,tags:[...prompt.tags],collectionId:prompt.collectionId||null,createdAt:new Date().toISOString(),note});
export const rollbackRevision=(prompt,revision)=>({...prompt,title:revision.title,content:revision.content,category:revision.category,tags:[...revision.tags],collectionId:revision.collectionId||null,updatedAt:new Date().toISOString()});
export const filterByCollection=(prompts,collectionId)=>collectionId?prompts.filter(p=>p.collectionId===collectionId):prompts;
export const searchPrompts=(prompts,query="")=>{const q=query.trim().toLowerCase();if(!q)return prompts;return prompts.filter(p=>((p.title||"").toLowerCase().includes(q)||(p.category||"").toLowerCase().includes(q)||(p.content||"").toLowerCase().includes(q)||(p.tags||[]).some(t=>t.toLowerCase().includes(q)))).sort((a,b)=>((a.title||"").toLowerCase().startsWith(q)?-1:0)-((b.title||"").toLowerCase().startsWith(q)?-1:0));};


