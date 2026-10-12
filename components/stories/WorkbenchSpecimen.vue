<script setup lang="ts">
import {computed,nextTick,onMounted,onBeforeUnmount,reactive,ref} from 'vue';
import WorkbenchLayout from '../src/components/workbench/WorkbenchLayout.vue';
import ActivityBar from '../src/components/activity-bar/ActivityBar.vue';
import Explorer from '../src/components/explorer/Explorer.vue';
import EditorTabs from '../src/components/editor-tabs/EditorTabs.vue';
import PanelTitle from '../src/components/panel-title/PanelTitle.vue';
import StatusBar from '../src/components/status-bar/StatusBar.vue';
import SearchView from '../src/components/search/SearchView.vue';
import WorkbenchQuickAccess from './WorkbenchQuickAccess.vue';
import type {WorkbenchQuickMode} from './WorkbenchQuickData';
import {revealDemoLine} from './WorkbenchData';
import WorkbenchSidebarView from './WorkbenchSidebarView.vue';
import {workbenchViews} from './WorkbenchViewsData';
import {searchExamples} from './SearchData';
import {activityBarItems} from './ActivityBarData';
import {explorerExamples} from './ExplorerData';
import {panelTitleItems,panelTitlePrimary,panelTitleSecondary} from './PanelTitleData';
import {statusBarEntries} from './StatusBarData';
import {workbenchSample,editorContent,panelContent,editorContentStyle,panelContentStyle} from './WorkbenchData';
import type {CSSProperties} from 'vue';
const props=defineProps<{theme:string}>();
const demo=new URLSearchParams(location.search).get('demo')==='true';
const side=new URLSearchParams(location.search).get('side')==='right'?'right':'left';
const layout=reactive({sidebarVisible:true,panelVisible:true,activityBarVisible:true,statusBarVisible:true,sidebarWidth:220,panelHeight:180});
const activity=ref('explorer'),panel=ref('problems'),active=ref<string|undefined>(workbenchSample.activeId),selected=ref([workbenchSample.activeId]),tabs=ref(structuredClone(workbenchSample.items));
const root=ref<HTMLElement>(),frame=ref<InstanceType<typeof WorkbenchLayout>>(),explorer=ref<InstanceType<typeof Explorer>>(),tabbar=ref<InstanceType<typeof EditorTabs>>(),status=ref<InstanceType<typeof StatusBar>>();
const explorerHeight=ref(498),lastRequest=ref('');
const quick=ref<InstanceType<typeof WorkbenchQuickAccess>>(),quickResult=ref('');
const statusEntries=ref(structuredClone(statusBarEntries));
const editorLines=computed(()=>editorContent(active.value,demo).split('\n').map(line=>line.replace(/^\s*\d+    /,'')));
function quickOpen(mode:WorkbenchQuickMode){void quick.value?.show(mode);}
function navigateLine(line:number,column:number){const entry=statusEntries.value.find(entry=>entry.id==='position')!;entry.text=`Ln ${line}, Col ${column}`;entry.ariaLabel=`Line ${line}, Column ${column}`;lastRequest.value=`goto:${line}:${column}`;if(editorBody.value)revealDemoLine(editorBody.value,line,column);}
function quickAccept(mode:WorkbenchQuickMode,value:string[]|string){
 const ids=Array.isArray(value)?value:[value],id=ids[0];
 if(mode==='files'){fileOpen({id,pinned:true});return;}
 if(mode==='commands'){if(['files','line','input','choice','multi'].includes(id))quickOpen(id as WorkbenchQuickMode);else if(id==='toggle-sidebar')setLayout({sidebarVisible:!layout.sidebarVisible});else if(id==='toggle-panel')setLayout({panelVisible:!layout.panelVisible});else if(id.startsWith('view:'))openView(id.slice(5));lastRequest.value=id;return;}
 if(mode==='choice'){const entry=statusEntries.value.find(entry=>entry.id==='language')!;entry.text=id;entry.ariaLabel=id;lastRequest.value=`language:${id}`;focusEditor();return;}
 quickResult.value=mode==='input'?`Profile created: ${value}`:`Workspace features: ${ids.join(', ')||'none'}`;panel.value='output';layout.panelVisible=true;lastRequest.value=quickResult.value;void nextTick(()=>panelBody.value?.focus());
}
const activityItems=activityBarItems().map(item=>({...item,pinned:true}));
const visited=ref(new Set(['explorer']));
const search=ref<InstanceType<typeof SearchView>>();
const searchQuery=ref('Button'),searchExpanded=ref(['app','button','readme']),replaceShown=ref(false);
const sidebarViews:Record<string,InstanceType<typeof WorkbenchSidebarView>>={};
function focusSidebar(id=activity.value){if(id==='explorer')explorer.value?.focusFiles();else if(id==='search')search.value?.focus();else sidebarViews[id]?.focus();}
function openView(id:string){activity.value=id;layout.sidebarVisible=true;activityOpen(id,true);}

const editorBody=ref<HTMLElement>(),panelBody=ref<HTMLElement>();
function focusEditor(){editorBody.value?.focus();}
function activityOpen(id:string,focus:boolean){visited.value.add(id);if(focus)void nextTick(()=>focusSidebar(id));}
function focusPanelOrEditor(){if(layout.panelVisible && panelBody.value?.parentElement?.contains(document.activeElement))panelBody.value.focus();else focusEditor();}
function activityVisibility(visible:boolean){if(!visible)void nextTick(focusPanelOrEditor);}
function panelOpen(_id:string,focus:boolean){if(focus)void nextTick(()=>panelBody.value?.focus());}
let editorFocusTimer:ReturnType<typeof setTimeout>;
function activateEditor(_id:string,preserveFocus:boolean){if(!preserveFocus)void nextTick(()=>{clearTimeout(editorFocusTimer);editorFocusTimer=setTimeout(focusEditor,0);});}
function setLayout(value:Partial<typeof layout>){Object.assign(layout,value);if(value.panelVisible===false)void nextTick(focusEditor);else if(value.sidebarVisible===false)void nextTick(focusPanelOrEditor);}
const config=structuredClone(explorerExamples[0]);const expanded=ref(config.expandedIds||[]),selectedFiles=ref<string[]>([]),activeEditor=ref('');
const themeClass=computed(()=>({dark:'vs-dark',light:'vs',hcDark:'hc-black',hcLight:'hc-light'})[props.theme]);
const state=computed(()=>({layout:{...layout},activity:activity.value,panel:panel.value,editor:active.value,editors:tabs.value.map(t=>t.id),lastRequest:lastRequest.value}));
function close(ids:string[]){const restoreFocus=!!active.value && ids.includes(active.value) && (document.activeElement===document.body || !!editorBody.value?.closest('.part.editor')?.contains(document.activeElement));for(const id of ids){const index=tabs.value.findIndex(t=>t.id===id);if(index<0)continue;tabs.value.splice(index,1);selected.value=selected.value.filter(s=>s!==id);if(active.value===id)active.value=tabs.value[Math.min(index,tabs.value.length-1)]?.id;}if(restoreFocus)void nextTick(focusEditor);}
function pin(id:string){const item=tabs.value.find(t=>t.id===id);if(item)item.preview=false;}
function unpin(id:string){const item=tabs.value.find(t=>t.id===id);if(item)item.sticky=false;}
function command(value:any){const id=typeof value==='string'?value:value.id;lastRequest.value=id;if(id==='cursor.go'){quickOpen('line');return;}if(id==='language.change'){quickOpen('choice');return;}if(id==='problems.show'){layout.panelVisible=true;panel.value='problems';void nextTick(()=>panelBody.value?.focus());}}
function panelAction(id:string){lastRequest.value=id;if(id==='close'){layout.panelVisible=false;void nextTick(focusEditor);}else if(id==='maximize')layout.panelHeight=layout.panelHeight>300?180:428;}
function fileOpen(value:any){lastRequest.value=`open:${value.id}`;const id=workbenchSample.items.some(tab=>tab.id===value.id)?value.id:value.id.includes('readme')?'readme':value.id.includes('package')?'package':undefined;if(id){
  let item=tabs.value.find(tab=>tab.id===id);
  if(!item){
    item=structuredClone(workbenchSample.items.find(tab=>tab.id===id)!);
    item.preview=!value.pinned && !item.dirty;
    if(item.preview)tabs.value=tabs.value.filter(tab=>!tab.preview);
    tabs.value.push(item);
  }else if(value.pinned)item.preview=false;
  active.value=id;selected.value=[id];if(!value.preserveFocus)void nextTick(focusEditor);
}}
let sidebarObserver:ResizeObserver;
onBeforeUnmount(()=>{sidebarObserver?.disconnect();clearTimeout(editorFocusTimer);});
onMounted(async()=>{await nextTick();const sidebar=root.value!.querySelector<HTMLElement>('[data-workbench-part=sidebar]')!;sidebarObserver=new ResizeObserver(()=>{explorerHeight.value=sidebar.clientHeight;});sidebarObserver.observe(sidebar);explorerHeight.value=sidebar.clientHeight;Object.assign(window,{fixtureReady:true,fixtureApi:{set:setLayout,snapshot:()=>JSON.parse(JSON.stringify(state.value)),openView,quickOpen,focus:(part:string)=>frame.value?.focus(part as any)}});Object.defineProperty(window,'fixtureState',{configurable:true,get:()=>state.value});});
</script>
<template><div ref="root" class="vc-theme fixture-root" :data-theme="theme" :class="themeClass" :style="demo ? {padding:0} : undefined"><div class="specimen" data-testid="specimen" :style="{height:demo ? '100vh' : '520px'}"><WorkbenchLayout ref="frame" :sidebar-side="side" v-model:sidebar-visible="layout.sidebarVisible" v-model:panel-visible="layout.panelVisible" v-model:activity-bar-visible="layout.activityBarVisible" v-model:status-bar-visible="layout.statusBarVisible" v-model:sidebar-width="layout.sidebarWidth" v-model:panel-height="layout.panelHeight">
<template #activity><ActivityBar :items="activityItems" v-model:active-id="activity" v-model:sidebar-visible="layout.sidebarVisible" :side="side" @open="activityOpen" @visibility="activityVisibility" /></template>
<template #sidebar>
  <div v-show="activity==='explorer'" data-activity-view="explorer" style="height:100%"><Explorer ref="explorer" v-bind="config" :height="explorerHeight" v-model:expanded-ids="expanded" v-model:selected-ids="selectedFiles" v-model:active-editor-id="activeEditor" @open="fileOpen" /></div>
  <div v-if="visited.has('search')" v-show="activity==='search'" data-activity-view="search" style="height:100%"><SearchView ref="search" :results="searchExamples[0].results" searched :height="explorerHeight" v-model:query="searchQuery" v-model:expanded-ids="searchExpanded" v-model:replace-shown="replaceShown" :context-actions="searchExamples[0].contextActions" @open="event=>fileOpen({...event,id:event.fileId})" /></div>
  <template v-for="view in workbenchViews" :key="view.id"><div v-if="visited.has(view.id)" v-show="activity===view.id" :data-activity-view="view.id" style="height:100%"><WorkbenchSidebarView :ref="value=>{if(value)sidebarViews[view.id]=value as InstanceType<typeof WorkbenchSidebarView>}" :id="view.id" :height="explorerHeight" /></div></template>
</template>
<template #editor><EditorTabs ref="tabbar" :items="tabs" v-model:active-id="active" v-model:selected-ids="selected" @activate="activateEditor" @close="close" @pin="pin" @unpin="unpin"><template #content><pre ref="editorBody" data-workbench-content="editor" tabindex="-1" aria-label="Editor content" :style="editorContentStyle as CSSProperties">{{editorContent(active,demo)}}</pre></template></EditorTabs></template>
<template #panel><div style="height:100%;background:var(--vscode-panel-background)"><PanelTitle :items="panelTitleItems()" v-model:active-id="panel" :primary="panelTitlePrimary" :secondary="panelTitleSecondary" @action="panelAction" @open="panelOpen" /><div ref="panelBody" data-workbench-content="panel" tabindex="-1" aria-label="Panel content" :style="panelContentStyle">{{panel==='output' && quickResult ? quickResult : panelContent(panel,demo)}}</div></div></template>
<template #status><StatusBar ref="status" :entries="statusEntries" @command="command" @hide="layout.statusBarVisible=false" @escape="focusEditor" /></template>
<template #overlays><WorkbenchQuickAccess ref="quick" :lines="editorLines" @accept="quickAccept" @navigate="navigateLine" /></template>
</WorkbenchLayout></div><button v-if="!demo" class="outside">Move focus outside</button></div></template>
