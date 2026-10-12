import { editorTabsCase } from './EditorTabsData';
export const workbenchSample = editorTabsCase();
export function editorContent(id?: string, demo = false) {
  if (demo) {
    const documents: Record<string, string> = {
      main: `import { createApp } from 'vue';\nimport App from './App.vue';\nimport './styles.css';\n\nconst app = createApp(App);\n\napp.mount('#app');`,
      readme: `# Classic Workbench\n\nA small workspace built from reusable UI components.\n\n## Getting started\n\n    npm install\n    npm run dev\n\n## Workspace\n\n- src/main.ts       Application entry\n- src/components   Shared components\n- package.json     Scripts and dependencies\n\nOpen a file in Explorer to switch documents.\nDrag the sidebar or panel divider to resize the workspace.`,
      package: `{\n  "name": "classic-workbench",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "vue-tsc && vite build"\n  },\n  "dependencies": {\n    "vue": "^3.5.0"\n  }\n}`,
      preview: '// Start typing in your application’s editor slot.\n',
    };
    return (documents[id || ''] || '').split('\n').map((line, index) => `${String(index + 1).padStart(3)}    ${line}`).join('\n');
  }
  const title=workbenchSample.items.find(item=>item.id===id)?.label || id || 'No editor selected';
  return `${title}\n\nThis area is supplied by the application through the editor slot.\n\nUse the Explorer, tabs, panel and status bar to exercise the composed controls.\nDrag the dividers to resize the sidebar and panel.\nDouble-click a divider to restore its preferred size.`;
}
export function panelContent(id: string, demo = false) {
  if (demo) return ({problems:'src/main.ts:4:7   Warning: “app” is declared but its value is never read.\n\nsrc/components/App.vue:12:3   Error: Type “string” is not assignable to type “number”.',output:'[09:41:02] Starting compilation in watch mode…\n[09:41:03] Watching for file changes.',terminal:'~/classic-workbench $ npm run dev\n\n  VITE  ready in 183 ms\n\n  ➜  Local:   http://localhost:5173/\n  ➜  press h + enter to show help', 'debug-console':'Debugger attached.\nApplication started.\nWaiting for the debugger to disconnect…'} as Record<string,string>)[id] || '';
  return `${id === 'problems' ? 'Problems' : id === 'output' ? 'Output' : id === 'terminal' ? 'Terminal' : 'Debug Console'} content slot`;
}
export const editorContentStyle = { margin:'0',padding:'20px',boxSizing:'border-box',height:'calc(100% - 35px)',overflow:'auto',font:'13px/22px Menlo, Monaco, monospace',whiteSpace:'pre-wrap',color:'var(--vscode-editor-foreground)',background:'var(--vscode-editor-background)'};
export const panelContentStyle = {padding:'12px 20px',color:'var(--vscode-foreground)',fontSize:'13px',whiteSpace:'pre-wrap',lineHeight:'20px'};

// The demo editor is a text slot. Quick navigation reveals/selects its displayed line.
export function revealDemoLine(element:HTMLElement,line:number,column:number){
 element.focus();element.dataset.line=String(line);element.dataset.column=String(column);
 const lines=(element.textContent||'').split('\n');const offset=lines.slice(0,line-1).reduce((sum,text)=>sum+text.length+1,0);
 const node=element.firstChild;if(node){const range=document.createRange();range.setStart(node,Math.min(offset,node.textContent?.length||0));range.setEnd(node,Math.min(offset+(lines[line-1]?.length||0),node.textContent?.length||0));const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range);}
 element.scrollTop=Math.max(0,(line-1)*22-element.clientHeight/2);
}
