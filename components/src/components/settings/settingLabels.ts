/* Copyright (c) Microsoft Corporation. Licensed under the MIT License. */
import type { SettingDefinition } from './types';
const acronyms=new Set(['css','html','scss','less','json','js','ts','ie','id','php','scm']);
const terms:Record<string,string>={'power shell':'PowerShell',powershell:'PowerShell',javascript:'JavaScript',typescript:'TypeScript',github:'GitHub',ocaml:'OCaml','jet brains':'JetBrains',jetbrains:'JetBrains','re sharper':'ReSharper',resharper:'ReSharper'};
function words(key:string){key=key.replace(/\.([a-z0-9])/g,(_,part)=>` › ${part.toUpperCase()}`).replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').replace(/^[a-z]/g,letter=>letter.toUpperCase()).replace(/\b\w+\b/g,word=>acronyms.has(word.toLowerCase())?word.toUpperCase():word);for(const[from,to]of Object.entries(terms))key=key.replace(new RegExp(`\\b${from}\\b`,'gi'),to);return key;}
export function settingLabels(setting: SettingDefinition, group: string) {
 if(setting.title) return {label:setting.title,category:setting.categoryLabel||''};
 const parts=setting.key.split('.'),key=parts.pop()!,category=parts.join('.');
 const groupParts=group.replaceAll('/','.').split('.');let trimmed=category;
 outer:for(const forward of [true,false]){const parts=[...groupParts];while(parts.length){const prefix=parts.join('.');if(category.toLowerCase()===prefix.toLowerCase()||category.toLowerCase().startsWith(prefix.toLowerCase()+'.')){trimmed=category.slice(prefix.length).replace(/^\./,'');break outer;}forward?parts.pop():parts.shift();}}
 return {label:words(key),category:words(trimmed)};
}
export function parseSettingsQuery(value: string) {
 const tags:string[]=[],ids:string[]=[];
 let query=value.replace(/@tag:(?:"([^"]*)"|([^\s]+))/g,(_,quoted,plain)=>{tags.push(plain||quoted);return '';});
 query=query.replace('@modified',()=>{tags.push('modified');return '';});
 query=query.replace(/@id:(?:"([^"]*)"|([^\s]+))/g,(_,quoted,plain)=>{ids.push(...(plain||quoted).split(',').map((id:string)=>id.trim()).filter(Boolean));return '';});
 return {query:query.trim().toLowerCase(),tags,ids};
}
