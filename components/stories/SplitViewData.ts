import type { SplitViewItem } from '../src/components/split-view/types';
export const splitMain:SplitViewItem[]=[{id:'explorer',size:150,minimumSize:60,maximumSize:280,snap:true},{id:'editor',size:230,minimumSize:80}];
export const splitStack:SplitViewItem[]=[{id:'problems',size:70,minimumSize:30,snap:true},{id:'terminal',size:70,minimumSize:30}];
export const splitTriple:SplitViewItem[]=[{id:'navigation',size:120,minimumSize:50,maximumSize:170,priority:'low'},{id:'content',size:120,minimumSize:70,maximumSize:300,priority:'high'},{id:'details',size:140,minimumSize:50,maximumSize:200}];
export const splitLabels:Record<string,string>={explorer:'Explorer',editor:'Editor',problems:'Problems',terminal:'Terminal',navigation:'Navigation',content:'Content',details:'Details',extra:'Extra'};
export const splitPaneStyle='padding:8px;box-sizing:border-box;overflow:hidden;height:100%;border:1px solid var(--vscode-sideBarSectionHeader-border)';
