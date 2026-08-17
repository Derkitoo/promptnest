import test from "node:test";import assert from "node:assert/strict";import{extractVariables,renderPrompt,validatePrompt,resolveConflict,inspectImport,createRevision,rollbackRevision,filterByCollection,searchPrompts}from"../packages/shared/prompt-core.mjs";
test("variables",()=>{assert.deepEqual(extractVariables("{{sujet}} / {{ sujet }}"),["sujet"]);assert.equal(renderPrompt("Salut {{nom}}",{nom:"Ada"}),"Salut Ada")});
test("validation",()=>{assert.equal(validatePrompt({title:"A",content:"B"}).ok,true);assert.equal(validatePrompt({title:"",content:"B"}).ok,false)});
test("latest update wins",()=>assert.equal(resolveConflict({updatedAt:"2026-01-01"},{updatedAt:"2026-02-01"}).updatedAt,"2026-02-01"));
test("import preview",()=>assert.deepEqual(inspectImport([{id:"1",title:"A",content:"B"}],[]).valid,1));
test("revision history",()=>{
 const original={id:"p1",title:"Version 1",content:"Contenu V1",category:"Dev",tags:["v1"],collectionId:null};
 const rev=createRevision(original,"Première révision");
 assert.equal(rev.promptId,"p1");
 assert.equal(rev.content,"Contenu V1");
 const updated={...original,title:"Version 2",content:"Contenu V2"};
 const restored=rollbackRevision(updated,rev);
 assert.equal(restored.title,"Version 1");
 assert.equal(restored.content,"Contenu V1");
});
test("collection filtering",()=>{
 const list=[{id:"1",collectionId:"col1"},{id:"2",collectionId:"col2"},{id:"3",collectionId:null}];
 assert.equal(filterByCollection(list,"col1").length,1);
 assert.equal(filterByCollection(list,null).length,3);
});
test("search prompts",()=>{
 const list=[{id:"1",title:"Revue de code",category:"Dev",content:"Analyser",tags:["git"]},{id:"2",title:"Marketing Copy",category:"Copy",content:"Vendre",tags:["ad"]}];
 assert.equal(searchPrompts(list,"code").length,1);
 assert.equal(searchPrompts(list,"git").length,1);
 assert.equal(searchPrompts(list,"").length,2);
});


