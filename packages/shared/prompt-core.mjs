export const extractVariables=(text)=>[...new Set([...text.matchAll(/{{\s*([\w.-]+)\s*}}/g)].map(m=>m[1]))];
export const renderPrompt=(text,values)=>text.replace(/{{\s*([\w.-]+)\s*}}/g,(_,key)=>String(values[key]??`{{${key}}}`));
export const validatePrompt=(value)=>({ok:typeof value?.title==="string"&&value.title.trim().length>0&&value.title.length<=160&&typeof value?.content==="string"&&value.content.trim().length>0&&value.content.length<=50000,errors:[]});
export const resolveConflict=(local,remote)=>new Date(local.updatedAt)>=new Date(remote.updatedAt)?local:remote;
export const inspectImport=(rows,existing=[])=>{const ids=new Set(existing.map(x=>x.id));return rows.reduce((r,x)=>{if(!validatePrompt(x).ok)r.invalid++;else if(ids.has(x.id))r.duplicates++;else{r.valid++;r.items.push(x)}return r},{valid:0,invalid:0,duplicates:0,items:[]});};
