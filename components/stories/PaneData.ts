import type { ActionBarEntry } from '../src/components/action-bar/types';
import type { MenuEntry } from '../src/components/menu/types';
export const paneActions: ActionBarEntry[] = [
  {id:'refresh',label:'Refresh',icon:'refresh'}, {id:'collapse',label:'Collapse All',icon:'collapse-all'},
];
export const paneSecondary: MenuEntry[] = [{id:'configure',label:'Configure View'}, {id:'hide',label:'Hide View'}];
export interface PaneExample {
  title:string; description?:string; expanded?:boolean; collapsible?:boolean; headerVisible?:boolean;
  actions?:readonly ActionBarEntry[]; secondaryActions?:readonly MenuEntry[]; actionsVisibility?:'hover'|'expanded'|'always';
  count?:number; location?:'sidebar'|'panel'; bodyHeight:number; body:'input'|'welcome'|'files';
}
export const paneExamples: PaneExample[] = [
  {title:'Open Editors',description:'workspace',actions:paneActions,secondaryActions:paneSecondary,bodyHeight:66,body:'files'},
  {title:'Outline',expanded:false,actions:paneActions,bodyHeight:62,body:'input'},
  {title:'Installed',count:12,actions:paneActions.slice(0,1),secondaryActions:paneSecondary,actionsVisibility:'always',bodyHeight:44,body:'welcome'},
  {title:'Timeline',description:'editor.ts',actions:paneActions,actionsVisibility:'expanded',bodyHeight:62,body:'input'},
  {title:'Fixed section',collapsible:false,bodyHeight:44,body:'welcome'},
  {title:'Merged header',headerVisible:false,bodyHeight:62,body:'input'},
  {title:'Problems',description:'2 errors in project',location:'panel',actions:paneActions,secondaryActions:paneSecondary,bodyHeight:44,body:'welcome'},
  {title:'A very long section title with an overflowing description',description:'long-workspace-description',expanded:false,actions:paneActions,secondaryActions:paneSecondary,actionsVisibility:'always',bodyHeight:62,body:'input'},
];
export const paneFiles = [{id:'index',label:'index.ts',icon:'file-code'},{id:'package',label:'package.json',icon:'json'},{id:'readme',label:'README.md',icon:'markdown'}];
export const paneBodyStyle = 'padding:8px;display:flex;align-items:center;gap:8px;box-sizing:border-box;height:100%';
