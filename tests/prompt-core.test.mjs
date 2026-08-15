import test from "node:test";import assert from "node:assert/strict";import{extractVariables,renderPrompt,validatePrompt,resolveConflict,inspectImport}from"../packages/shared/prompt-core.mjs";
test("variables",()=>{assert.deepEqual(extractVariables("{{sujet}} / {{ sujet }}"),["sujet"]);assert.equal(renderPrompt("Salut {{nom}}",{nom:"Ada"}),"Salut Ada")});
test("validation",()=>{assert.equal(validatePrompt({title:"A",content:"B"}).ok,true);assert.equal(validatePrompt({title:"",content:"B"}).ok,false)});
test("latest update wins",()=>assert.equal(resolveConflict({updatedAt:"2026-01-01"},{updatedAt:"2026-02-01"}).updatedAt,"2026-02-01"));
test("import preview",()=>assert.deepEqual(inspectImport([{id:"1",title:"A",content:"B"}],[]).valid,1));
