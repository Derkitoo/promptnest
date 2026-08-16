import { build } from "vite";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
const root=process.cwd(),source=path.join(root,"extension"),output=path.join(source,"dist");await rm(output,{recursive:true,force:true});await mkdir(path.join(output,"icons"),{recursive:true});
await build({configFile:false,root,publicDir:false,build:{emptyOutDir:false,minify:"esbuild",target:"chrome120",lib:{entry:path.join(source,"src/popup.js"),formats:["iife"],name:"PromptNestPopup",fileName:()=>"popup.js"},outDir:output}});
await build({configFile:false,root,publicDir:false,build:{emptyOutDir:false,minify:"esbuild",target:"chrome120",lib:{entry:path.join(source,"src/background.js"),formats:["es"],fileName:()=>"background.js"},outDir:output}});
for(const file of["manifest.json","popup.html","popup.css","privacy.html"])await cp(path.join(source,file),path.join(output,file));await cp(path.join(source,"icons"),path.join(output,"icons"),{recursive:true});const manifest=JSON.parse(await readFile(path.join(output,"manifest.json"),"utf8"));if(manifest.manifest_version!==3)throw new Error("Manifest V3 requis");await writeFile(path.join(output,"BUILD_INFO.txt"),`PromptNest ${manifest.version}\nExtension ID: beflijeobbbggeimbknjohpckbkdaphb\nOAuth redirect: https://beflijeobbbggeimbknjohpckbkdaphb.chromiumapp.org/supabase\n`);
