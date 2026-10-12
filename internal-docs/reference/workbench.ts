// A host composition of the independently tested native Grid and native parts.
// The center document and panel body are explicit sample slots, not editor engines.
import {mountWorkbenchQuick} from './workbench-quick';
import type {WorkbenchQuickMode} from '../../components/stories/WorkbenchQuickData';
import {revealDemoLine} from '../../components/stories/WorkbenchData';
import {mountWorkbenchLayout} from './workbench-layout';
import {mountActivityBar} from './activity-bar';
import {mountExplorer} from './explorer';
import {mountEditorTabs} from './editor-tabs';
import {mountPanelTitle} from './panel-title';
import {mountStatusBar} from './status-bar';
import {mountSearch} from './search';
import {mountWorkbenchSidebar} from './workbench-sidebar';
import {activityBarItems} from '../../components/stories/ActivityBarData';
import {editorContent,panelContent,editorContentStyle,panelContentStyle} from '../../components/stories/WorkbenchData';
export function mountWorkbench(root:HTMLElement,surface:HTMLElement,state:any){
 const demo=new URLSearchParams(location.search).get('demo')==='true';
 if(demo){root.style.padding='0';root.querySelector<HTMLElement>('.outside')!.hidden=true;}
 for(const key of Object.keys(state))delete state[key];
 const layoutState:any={};const layout=mountWorkbenchLayout(root,surface,layoutState,{height:demo?'100vh':undefined});
 const slots=layout.views;for(const view of Object.values(slots))view.element.replaceChildren();
 const records:any={activity:{},explorer:{},editor:{},panel:{},status:{}};const apis:any={};
 const documentBody=document.createElement('pre');Object.assign(documentBody.style,editorContentStyle);documentBody.tabIndex=-1;documentBody.dataset.workbenchContent='editor';documentBody.setAttribute('aria-label','Editor content');
 const panelBody=document.createElement('div');Object.assign(panelBody.style,panelContentStyle);panelBody.tabIndex=-1;panelBody.dataset.workbenchContent='panel';panelBody.setAttribute('aria-label','Panel content');
 const sidebarHosts=new Map<string,HTMLElement>();
 const sidebarApis=new Map<string,{focus:()=>void;resize:(width:number,height:number)=>void}>();
 function showSidebar(id:string,focus:boolean){
  let holder=sidebarHosts.get(id);
  if(!holder){
   holder=document.createElement('div');holder.dataset.activityView=id;holder.style.height='100%';slots.sidebar.element.append(holder);sidebarHosts.set(id,holder);
   const content=document.createElement('div');holder.append(content);
   if(id==='search'){mountSearch(root,content,{}, {width:slots.sidebar.element.clientWidth,height:slots.sidebar.element.clientHeight});content.classList.remove('specimen');sidebarApis.set(id,(window as any).fixtureSearch);}
   else sidebarApis.set(id,mountWorkbenchSidebar(root,content,id,slots.sidebar.element.clientHeight));
  }
  for(const [key,host] of sidebarHosts)host.hidden=key!==id;
  sidebarApis.get(id)?.resize(slots.sidebar.element.clientWidth,slots.sidebar.element.clientHeight);
  if(focus)sidebarApis.get(id)?.focus();
 }
 function focusEditor(){documentBody.focus();}
 function focusPanelOrEditor(){if(layoutState.panelVisible && slots.panel.element.contains(document.activeElement))panelBody.focus();else focusEditor();}
 function mount(id:keyof typeof records,part:HTMLElement,factory:any){const host=document.createElement('div');host.style.cssText='width:100%;height:100%;position:relative';part.append(host);factory(root,host,records[id]);host.classList.remove('specimen');host.style.cssText='width:100%;height:100%;position:relative';apis[id]=(window as any).fixtureApi;return host;}
 mount('activity',slots.activity.element,(r:HTMLElement,s:HTMLElement,v:any)=>mountActivityBar(r,s,v,{
  onOpen:(id,focus)=>{layout.api.set({sidebarVisible:true});showSidebar(id,focus);queueMicrotask(sync);},
  onVisibility:visible=>{layout.api.set({sidebarVisible:visible});if(!visible)focusPanelOrEditor();queueMicrotask(sync);},
 },activityBarItems().map(item=>({...item,pinned:true}))));
 const explorerHost=mount('explorer',slots.sidebar.element,(r:HTMLElement,s:HTMLElement,v:any)=>mountExplorer(r,s,v,{width:220,height:498,onOpen:()=>queueMicrotask(sync)}));apis.explorer=(window as any).fixtureExplorer;explorerHost.dataset.activityView='explorer';sidebarHosts.set('explorer',explorerHost);sidebarApis.set('explorer',{resize:apis.explorer.resize,focus:apis.explorer.focusFiles});
 // Finish the host's editor focus after the tab's mousedown default action.
 const tabsHost=mount('editor',slots.editor.element,(r:HTMLElement,s:HTMLElement,v:any)=>mountEditorTabs(r,s,v,{focusEditor:()=>setTimeout(focusEditor,0),onChange:()=>queueMicrotask(sync)}));tabsHost.style.height='100%';tabsHost.querySelectorAll<HTMLElement>('.part.editor, .part.editor > .content').forEach(el=>el.style.height='100%');
 tabsHost.querySelector('.editor-group-container')!.append(documentBody);
 const panelHost=mount('panel',slots.panel.element,(r:HTMLElement,s:HTMLElement,v:any)=>mountPanelTitle(r,s,v,{onOpen:(_id,focus)=>{layout.api.set({panelVisible:true});if(focus)panelBody.focus();queueMicrotask(sync);},onChange:()=>queueMicrotask(sync)}));panelHost.style.height='35px';slots.panel.element.style.background='var(--vscode-panel-background)';
 slots.panel.element.append(panelBody);
 mount('status',slots.status.element,(r:HTMLElement,s:HTMLElement,v:any)=>mountStatusBar(r,s,v,{focusEditor,onChange:()=>queueMicrotask(sync)}));
 let quickResult='';
 let lastRequest='',opens=0,actions=0,commands=0,lastActivityVisible=true,lastActivity='explorer';
 function sync(){
  if(records.activity.visible!==lastActivityVisible||records.activity.activeId!==lastActivity){lastActivityVisible=records.activity.visible;lastActivity=records.activity.activeId;layout.api.set({sidebarVisible:lastActivityVisible});}
  if(records.panel.actions.length>actions){const id=records.panel.actions.at(-1);actions=records.panel.actions.length;lastRequest=id;if(id==='close'){layout.api.set({panelVisible:false});focusEditor();}else if(id==='maximize')layout.api.set({panelHeight:layoutState.panelHeight>300?180:428});}
  if(records.status.commands.length>commands){const entry=records.status.commands.at(-1);commands=records.status.commands.length;const id=entry.id;lastRequest=id;if(id==='cursor.go')quick.show('line');else if(id==='language.change')quick.show('choice');else if(id==='problems.show'){layout.api.set({panelVisible:true});apis.panel.activate('problems');records.panel.activeId='problems';panelBody.focus();}}
  if(records.explorer.opens.length>opens){const entry=records.explorer.opens.at(-1);opens=records.explorer.opens.length;lastRequest=`open:${entry.id}`;const id=entry.id.includes('readme')?'readme':entry.id.includes('package')?'package':undefined;if(id)apis.editor.select(id,entry.preserveFocus,entry.pinned);}
  documentBody.textContent=editorContent(records.editor.active,demo);panelBody.textContent=records.panel.activeId==='output'&&quickResult?quickResult:panelContent(records.panel.activeId,demo);
  Object.assign(state,{layout:{...layoutState},activity:records.activity.activeId,panel:records.panel.activeId,editor:records.editor.active,editors:records.editor.items.slice(),lastRequest});
 }
 const quick=mountWorkbenchQuick(root,surface,{
  focus:focusEditor,lines:()=>editorContent(records.editor.active,demo).split('\n').map(line=>line.replace(/^\s*\d+    /,'')),
  navigate:(line,column)=>{apis.status.update('position',{text:`Ln ${line}, Col ${column}`,ariaLabel:`Line ${line}, Column ${column}`});lastRequest=`goto:${line}:${column}`;sync();revealDemoLine(documentBody,line,column);},
  accept:(mode,value)=>{
   const ids=Array.isArray(value)?value:[value],id=ids[0];
   if(mode==='files'){apis.editor.select(id,false,true);lastRequest=`open:${id}`;}
   else if(mode==='commands'){
    if(['files','line','input','choice','multi'].includes(id))quick.show(id as WorkbenchQuickMode);
    else if(id==='toggle-sidebar'){const visible=!layoutState.sidebarVisible;layout.api.set({sidebarVisible:visible});apis.activity.setVisible(visible);if(!visible)focusPanelOrEditor();}
    else if(id==='toggle-panel'){layout.api.set({panelVisible:!layoutState.panelVisible});focusEditor();}
    else if(id.startsWith('view:'))apis.activity.open(id.slice(5),true);
    lastRequest=id;
   }else if(mode==='choice'){apis.status.update('language',{text:id,ariaLabel:id});lastRequest=`language:${id}`;focusEditor();}
   else{quickResult=mode==='input'?`Profile created: ${value}`:`Workspace features: ${ids.join(', ')||'none'}`;layout.api.set({panelVisible:true});apis.panel.activate('output');records.panel.activeId='output';lastRequest=quickResult;panelBody.focus();}
   sync();
  },
 });
 const observer=new ResizeObserver(()=>{for(const api of sidebarApis.values())api.resize(slots.sidebar.element.clientWidth,slots.sidebar.element.clientHeight);sync();});observer.observe(slots.sidebar.element);
 for(const event of ['click','dblclick','keydown','pointerup','contextmenu'])document.addEventListener(event,()=>queueMicrotask(sync));
 sync();(window as any).fixtureApi={set:(value:any)=>{layout.api.set(value);if(value.sidebarVisible!==undefined)apis.activity.setVisible(value.sidebarVisible);if(value.panelVisible===false)focusEditor();sync();},snapshot:()=>structuredClone(state),quickOpen:(mode:WorkbenchQuickMode)=>quick.show(mode),openView:(id:string)=>apis.activity.open(id,true),focus:(part:string)=>slots[part as keyof typeof slots]?.element.querySelector<HTMLElement>('[tabindex="0"],button,input')?.focus()};
 (window as any).fixtureReady=true;
}
