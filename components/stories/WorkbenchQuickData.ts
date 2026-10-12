import type { QuickPickEntry, QuickPickProps } from '../src/components/quick-input/quickPickTypes';
export type WorkbenchQuickMode = 'files' | 'commands' | 'line' | 'input' | 'choice' | 'multi';
export const quickInitial = (mode:WorkbenchQuickMode) => mode==='commands'?'>':mode==='line'?':':'';
export const quickMode = (mode:WorkbenchQuickMode,value:string):WorkbenchQuickMode => ['files','commands','line'].includes(mode) ? value.startsWith('>')?'commands':value.startsWith(':')?'line':'files' : mode;
export const quickFilter = (value:string) => /^[>:]/.test(value)?value.slice(1).trimStart():value;
export const quickFiles:QuickPickEntry[] = [
 {id:'readme',label:'README.md',description:'classic-workbench',icon:'markdown'},
 {id:'main',label:'main.ts',description:'src',icon:'file-code'},
 {id:'package',label:'package.json',description:'classic-workbench',icon:'json'},
 {id:'preview',label:'Untitled-1',icon:'file'},
];
const commands:QuickPickEntry[] = [
 {id:'files',label:'Go to File...',keybinding:[{metaKey:true,key:'P'}]},
 {id:'line',label:'Go to Line/Column...',keybinding:[{ctrlKey:true,key:'G'}]},
 {id:'toggle-sidebar',label:'View: Toggle Primary Side Bar Visibility',keybinding:[{metaKey:true,key:'B'}]},
 {id:'toggle-panel',label:'View: Toggle Panel',keybinding:[{metaKey:true,key:'J'}]},
 {id:'view:search',label:'View: Show Search'},
 {id:'view:extensions',label:'View: Show Extensions'},
 {id:'input',label:'Demo: Enter a Profile Name'},
 {id:'choice',label:'Change Language Mode'},
 {id:'multi',label:'Demo: Select Workspace Features'},
];
export const languages:QuickPickEntry[]=['TypeScript','JavaScript','JSON','Markdown','Plain Text'].map(label=>({id:label,label}));
const features:QuickPickEntry[]=[{id:'editor',label:'Editor',type:'separator'}, {id:'format',label:'Format on Save',description:'Format documents when saving'}, {id:'lint',label:'Linting',description:'Show diagnostics while editing'}, {id:'workspace',label:'Workspace',type:'separator'}, {id:'tests',label:'Test Explorer',description:'Discover workspace tests'}, {id:'git',label:'Source Control',description:'Show repository changes'}];
export function lineTarget(value:string,lines:readonly string[]) {
 const parts=value.slice(1).split(/[:,#]/), raw=parseInt(parts[0],10), count=Math.max(1,lines.length);
 if(Number.isNaN(raw))return {label:`Type a line number to go to (from 1 to ${count}).`};
 const line=Math.min(count,Math.max(1,raw<0?count+1+raw:raw)),max=(lines[line-1]?.length||0)+1,rawColumn=parseInt(parts[1],10);
 const column=Number.isNaN(rawColumn)?1:Math.min(max,Math.max(1,rawColumn<0?max+rawColumn:rawColumn));
 const label=parts.length===1?`Press 'Enter' to go to line ${line} or enter colon : to add a column number.`:Number.isNaN(rawColumn)?`Press 'Enter' to go to line ${line} or enter a column number (from 1 to ${max}).`:`Press 'Enter' to go to line ${line} at column ${column}.`;
 return {line,column,label};
}
export function quickProps(mode:WorkbenchQuickMode,value:string,lines:readonly string[]):QuickPickProps {
 const base={filterValue:quickFilter,sortByLabel:false,hideCountBadge:true,matchOnLabel:true,matchOnDescription:false,matchOnDetail:false,canSelectMany:false,title:undefined,description:undefined};
 if(mode==='commands')return {...base,items:commands,placeholder:'Type the name of a command to run.'};
 if(mode==='line'){const target=lineTarget(value,lines);return {...base,items:[{id:'position',label:target.label,alwaysShow:true}],matchOnLabel:false,placeholder:'Type a line number and optional column (for example :12:5).'};}
 if(mode==='choice')return {...base,items:languages,placeholder:'Select Language Mode',matchOnDescription:true};
 if(mode==='multi')return {...base,items:features,title:'Workspace Features',placeholder:'Select features to enable',canSelectMany:true,hideCountBadge:false};
 return {...base,items:quickFiles,matchOnDescription:true,placeholder:'Search files by name',description:undefined};
}
export const profilePrompt='Enter a name for this workspace profile';
export function profileError(value:string){return !value.trim()?'A profile name is required.':/[\\/]/.test(value)?'A profile name cannot contain / or \\.':'';}
export function quickKey(event:KeyboardEvent):WorkbenchQuickMode|undefined {
 if(event.isComposing||event.altKey)return;
 const mac=navigator.platform.includes('Mac'),primary=mac?event.metaKey:event.ctrlKey;
 if(event.key==='F1')return 'commands';
 if(primary&&event.key.toLowerCase()==='p')return event.shiftKey?'commands':'files';
 if(event.ctrlKey&&!event.metaKey&&!event.shiftKey&&event.key.toLowerCase()==='g')return 'line';
}
