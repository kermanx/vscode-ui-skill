import type { PaneViewItem } from '../src/components/pane-view/types';
import type { TreeNode } from '../src/components/tree/types';
import type { ActionBarEntry } from '../src/components/action-bar/types';
export interface WorkbenchSection extends PaneViewItem {
  title:string;
  expanded?:boolean;
  nodes:TreeNode[];
  expandedIds?:string[];
  actions?:ActionBarEntry[];
}
export interface WorkbenchView {
  id:string;
  title:string;
  filter?:{placeholder:string;label:string;button?:string};
  sections:WorkbenchSection[];
}
// Local demonstration data. Shell, pane and tree geometry belongs to the controls.
export const workbenchViews:WorkbenchView[] = [
  {id:'source-control',title:'Source Control',filter:{placeholder:'Message (⌘Enter to commit)',label:'Commit message',button:'Commit'},sections:[
    {id:'changes',title:'Changes',size:230,minimumBodySize:66,nodes:[
      {id:'scm-main',label:'main.ts',description:'src',icon:'file-code',actions:[{id:'stage',label:'Stage Changes',icon:'add'}]},
      {id:'scm-app',label:'App.vue',description:'src',icon:'file-code',actions:[{id:'stage',label:'Stage Changes',icon:'add'}]},
      {id:'scm-readme',label:'README.md',icon:'markdown',actions:[{id:'stage',label:'Stage Changes',icon:'add'}]},
    ],actions:[{id:'stage-all',label:'Stage All Changes',icon:'add'}]},
    {id:'staged',title:'Staged Changes',size:160,minimumBodySize:44,nodes:[{id:'scm-package',label:'package.json',icon:'json'}]},
    {id:'graph',title:'Source Control Graph',size:160,expanded:false,nodes:[{id:'head',label:'main',description:'Update workbench layout',icon:'git-commit'},{id:'previous',label:'Initial commit',icon:'git-commit'}]},
  ]},
  {id:'debug',title:'Run and Debug',sections:[
    {id:'variables',title:'Variables',size:160,minimumBodySize:66,expandedIds:['locals'],nodes:[{id:'locals',label:'Locals',icon:'symbol-namespace',children:[{id:'name',label:'name:',description:'"Classic Workbench"',icon:'symbol-string'},{id:'count',label:'count:',description:'3',icon:'symbol-number'}]}]},
    {id:'watch',title:'Watch',size:100,minimumBodySize:44,actions:[{id:'add-expression',label:'Add Expression',icon:'add'}],nodes:[{id:'items-length',label:'items.length:',description:'3',icon:'symbol-number'}]},
    {id:'call-stack',title:'Call Stack',size:140,minimumBodySize:66,nodes:[{id:'render',label:'render',description:'App.vue:12',icon:'debug-stackframe-focused'},{id:'setup',label:'setup',description:'main.ts:6',icon:'debug-stackframe'}]},
    {id:'breakpoints',title:'Breakpoints',size:120,minimumBodySize:44,nodes:[{id:'breakpoint-main',label:'main.ts',description:'6',icon:'debug-breakpoint'},{id:'exceptions',label:'Uncaught Exceptions',icon:'debug-breakpoint-conditional'}]},
  ]},
  {id:'extensions',title:'Extensions',filter:{placeholder:'Search Extensions in Marketplace',label:'Search Extensions'},sections:[
    {id:'installed',title:'Installed',size:250,minimumBodySize:66,nodes:[{id:'vue',label:'Vue - Official',description:'Vue',icon:'extensions'},{id:'python',label:'Python',description:'Microsoft',icon:'extensions'},{id:'eslint',label:'ESLint',description:'Microsoft',icon:'extensions'}]},
    {id:'recommended',title:'Recommended',size:190,minimumBodySize:44,nodes:[{id:'prettier',label:'Prettier - Code formatter',description:'Prettier',icon:'extensions'},{id:'gitlens',label:'GitLens',description:'GitKraken',icon:'extensions'}]},
  ]},
  {id:'testing',title:'Testing',sections:[
    {id:'tests',title:'Test Explorer',size:400,minimumBodySize:120,expandedIds:['suite','unit'],actions:[{id:'run-tests',label:'Run Tests',icon:'play'},{id:'refresh-tests',label:'Refresh Tests',icon:'refresh'}],nodes:[{id:'suite',label:'classic-workbench',icon:'beaker',children:[{id:'unit',label:'components',icon:'folder',children:[{id:'test-tabs',label:'editor-tabs.spec.ts',icon:'testing-passed-icon'},{id:'test-sidebar',label:'sidebar.spec.ts',icon:'testing-passed-icon'},{id:'test-layout',label:'layout.spec.ts',icon:'testing-failed-icon'}]}]}]},
    {id:'coverage',title:'Test Coverage',size:120,expanded:false,nodes:[{id:'coverage-components',label:'components',description:'92.4%',icon:'folder'}]},
  ]},
  {id:'ports',title:'Ports',filter:{placeholder:'Port number or address',label:'Port to forward',button:'Forward a Port'},sections:[
    {id:'forwarded',title:'Forwarded Ports',size:400,minimumBodySize:120,nodes:[{id:'port-5173',label:'5173',description:'localhost:5173 · Vite',icon:'radio-tower'},{id:'port-6006',label:'6006',description:'localhost:6006 · Storybook',icon:'radio-tower'}]},
  ]},
];
export function workbenchView(id:string) { return structuredClone(workbenchViews.find(view=>view.id===id)!); }
