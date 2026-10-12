<!-- Copyright (c) Microsoft Corporation. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue';
import ActionBar from '../action-bar/ActionBar.vue';
import Toolbar from '../toolbar/Toolbar.vue';
import { searchFilterActions, applySearchFilter } from './searchFilters';
import SplitView from '../split-view/SplitView.vue';
import ScrollableElement from '../scrollable-element/ScrollableElement.vue';
import SettingsRow from './SettingsRow.vue';
import SettingsToc from './SettingsToc.vue';
import { parseSettingsQuery, settingLabels } from './settingLabels';
import type { SettingChange, SettingDefinition, SettingsGroup, SettingsTarget, SettingsValues } from './types';
import '../count-badge/countBadge.css';
import './settingsEditor.css';
import './settings.css';
import './settingsWidgets.css';
import '../tree/upstream/tree.css';
import '../tree/upstream/list.css';
const props=withDefaults(defineProps<{groups:readonly SettingsGroup[];height?:number;workspaceLabel?:string}>(),{height:620,workspaceLabel:'Workspace'});
const allProfiles=defineModel<string[]>('allProfiles',{default:()=>[]});
const values=defineModel<SettingsValues>('values',{default:()=>({user:{},workspace:{}})});
const target=defineModel<SettingsTarget>('target',{default:'user'}),query=defineModel<string>('query',{default:''}),category=defineModel<string>('category',{default:''});
const emit=defineEmits<{change:[change:SettingChange];openJson:[key:string];copy:[text:string];focus:[key:string]}>();
const root=ref<HTMLElement>(),search=ref<HTMLElement>(),searchControls=ref<HTMLElement>(),tree=ref<HTMLElement>(),split=ref<InstanceType<typeof SplitView>>(),scroll=ref<InstanceType<typeof ScrollableElement>>();
const width=ref(880),sizes=ref([200,680]),scrollTop=ref(0),focused=ref(''),searchFocused=ref(false),searchText=ref(query.value),activeQuery=ref(query.value);
const searchWidth=ref(745);
const imeTextArea=ref<HTMLTextAreaElement>();
let searchImeEnabled=true,pausedSearchFocus=false,savedSearchSelection:Range|undefined;
// NativeEditContext keeps a readonly text area as a focus sink while IME input
// is suspended by a host command. Preserve the plain search's DOM selection.
function setSearchImeEnabled(enabled:boolean){
 searchImeEnabled=enabled;
 if(!enabled&&document.activeElement===search.value){
  const selection=document.getSelection();savedSearchSelection=selection?.rangeCount?selection.getRangeAt(0).cloneRange():undefined;
  pausedSearchFocus=true;imeTextArea.value?.focus();
 }else if(enabled&&pausedSearchFocus){
  pausedSearchFocus=false;search.value?.focus();
  if(savedSearchSelection&&search.value?.contains(savedSearchSelection.startContainer)){
   const selection=document.getSelection();selection?.removeAllRanges();selection?.addRange(savedSearchSelection);
  }
  savedSearchSelection=undefined;
 }
}
function searchFocus(){searchFocused.value=true;if(!searchImeEnabled)setSearchImeEnabled(false);}
function searchBlur(){if(!pausedSearchFocus)searchFocused.value=false;}

function layoutSearch(){searchWidth.value=Math.max(0,Math.min(width.value,1400)-48-10-(searchControls.value?.clientWidth||65)-12);}
function syncSearch(){if(search.value&&search.value.textContent!==searchText.value)search.value.textContent=searchText.value;}
function searchInput(){searchText.value=(search.value?.textContent||'').replace(/[\r\n]/g,'');}
function pasteSearch(event:ClipboardEvent){event.preventDefault();document.execCommand('insertText',false,(event.clipboardData?.getData('text/plain')||'').replace(/[\r\n]/g,''));}
const treeHeight=computed(()=>Math.max(0,props.height-97));
const narrow=computed(()=>width.value<700);
const parsed=computed(()=>parseSettingsQuery(activeQuery.value));
const matched=computed(()=>props.groups.map(group=>({...group,settings:group.settings.filter(setting=>{const labels=settingLabels(setting,group.id),modified=Object.hasOwn(values.value[target.value],setting.key);const tags=[...(setting.tags||[]),...(modified?['modified']:[])];return parsed.value.tags.every(tag=>tags.includes(tag))&&(!parsed.value.ids.length||parsed.value.ids.includes(setting.key))&&(!parsed.value.query||`${setting.key} ${setting.description} ${labels.label}`.toLowerCase().includes(parsed.value.query));})})).filter(group=>group.settings.length));
const visibleGroups=computed(()=>matched.value.filter(group=>!category.value||category.value===group.id));
const count=computed(()=>visibleGroups.value.reduce((total,group)=>total+group.settings.length,0));
const toc=computed(()=>matched.value.map(group=>({id:group.id,label:group.label,count:group.settings.length})));
const tabs=computed(()=>[{id:'user',label:'User',checked:target.value==='user'},{id:'workspace',label:props.workspaceLabel,checked:target.value==='workspace'}]);
const views=computed(()=>[{id:'toc',size:200,minimumSize:100,visible:!narrow.value},{id:'settings',minimumSize:500}]);
const rows=computed(()=>visibleGroups.value.flatMap(group=>[{id:group.id,group,setting:undefined as SettingDefinition|undefined},...group.settings.map(setting=>({id:setting.key,group,setting}))]));
const rowHeights=ref<Record<string,number>>({});
const layoutRows=computed(()=>{let top=0;return rows.value.map((row,index)=>{const height=rowHeights.value[row.id]??(row.setting?row.setting.type==='boolean'?78:104:42);const item={...row,index,top,height};top+=height;return item;});});
const totalHeight=computed(()=>{const last=layoutRows.value.at(-1);return last?last.top+last.height:0;});
const renderedRows=computed(()=>layoutRows.value.filter(row=>row.top+row.height>scrollTop.value&&row.top<scrollTop.value+treeHeight.value));
function measureRows(){const next={...rowHeights.value};let changed=false;tree.value?.querySelectorAll<HTMLElement>('[data-setting-row]').forEach(row=>{const height=(row.firstElementChild as HTMLElement).offsetHeight;if(next[row.dataset.settingRow!]!==height){next[row.dataset.settingRow!]=height;changed=true;}});if(changed)rowHeights.value=next;}
onUpdated(()=>{measureRows();layoutSearch();syncSearch();});
let timer:ReturnType<typeof setTimeout>,observer:ResizeObserver;
watch(query,value=>{searchText.value=value;clearTimeout(timer);timer=setTimeout(()=>{activeQuery.value=value;category.value='';scrollTop.value=0;},200);});
watch(searchText,value=>{query.value=value;});
watch(target,()=>{scrollTop.value=0;});
watch(category,()=>{scrollTop.value=0;});
watch(narrow,async value=>{await nextTick();split.value?.setViewVisible(0,!value);if(!value)split.value?.resizeView(0,200);});
onMounted(()=>{observer=new ResizeObserver(()=>{width.value=root.value?.clientWidth||880;layoutSearch();});observer.observe(root.value!);observer.observe(searchControls.value!);width.value=root.value!.clientWidth;void nextTick(()=>{measureRows();layoutSearch();syncSearch();});});
onBeforeUnmount(()=>{clearTimeout(timer);observer?.disconnect();savedSearchSelection=undefined;search.value?.blur();imeTextArea.value?.blur();});
function change(setting:SettingDefinition,value:unknown,manualReset=false){const scoped={...values.value[target.value]};if(value===undefined)delete scoped[setting.key];else scoped[setting.key]=value;values.value={...values.value,[target.value]:scoped};emit('change',{key:setting.key,value,target:target.value,manualReset});}
function settingValue(setting:SettingDefinition){const value=values.value[target.value][setting.key];return value===undefined?setting.defaultValue:value;}
function copy(setting:SettingDefinition,kind:'id'|'json'|'url'){const value=settingValue(setting);emit('copy',kind==='id'?setting.key:kind==='json'?`"${setting.key}": ${JSON.stringify(value,null,2)}`:`vscode://settings/${setting.key}`);}
function focusRow(key:string){focused.value=key;emit('focus',key);}
function reveal(id:string){const row=layoutRows.value.find(row=>row.id===id);if(!row)return;if(row.top<scrollTop.value)scrollTop.value=row.top;else if(row.top+row.height>scrollTop.value+treeHeight.value)scrollTop.value=row.top+row.height-treeHeight.value;}
function keyboard(event:KeyboardEvent){if(event.target!==tree.value)return;const index=rows.value.findIndex(row=>row.id===focused.value);let next=index;if(event.key==='ArrowDown')next=Math.min(rows.value.length-1,index+1);else if(event.key==='ArrowUp')next=Math.max(0,index-1);else if(event.key==='Home')next=0;else if(event.key==='End')next=rows.value.length-1;else if(event.key==='Tab'&&!event.shiftKey){const control=tree.value?.querySelector<HTMLElement>(`[data-setting-row="${CSS.escape(focused.value)}"] .setting-control-focus-target`);if(control){control.focus();event.preventDefault();}return;}else return;focused.value=rows.value[next]?.id||'';reveal(focused.value);event.preventDefault();event.stopPropagation();}
function scope(setting:SettingDefinition,nextTarget:SettingsTarget){target.value=nextTarget;const filter=`@id:${setting.key}`;if(!query.value.includes(filter))query.value=`${filter} ${query.value.trimStart()}`;void nextTick(()=>search.value?.focus());}
function filterAction(id:string){if(id==='clear')query.value='';else query.value=applySearchFilter(query.value,id);void nextTick(()=>search.value?.focus());}
function resetSash(){split.value?.resizeView(0,200);}
defineExpose({setSearchImeEnabled,focus:()=>search.value?.focus(),reveal,resetCategory:()=>{category.value='';},setQuery:(value:string)=>{query.value=value;}});
</script>
<template>
 <div ref="root" class="settings-editor" :class="{'narrow-width':narrow,'no-results':!count,'search-mode':!!activeQuery}" tabindex="-1" :style="{height:`${height}px`}">
  <div class="settings-header"><div class="search-container"><div class="suggest-input-container" :class="{'synthetic-focus':searchFocused}"><div class="suggest-input-placeholder" :style="{width:`${searchWidth-2}px`,visibility:searchText?'hidden':'visible'}">Search settings</div><div class="vc-settings-search-viewport" :style="{width:`${searchWidth}px`}"><textarea ref="imeTextArea" class="ime-text-area" readonly tabindex="-1" aria-hidden="true" @keydown.down.prevent="tree?.focus()" /><div class="vc-settings-search-lines"><div ref="search" class="vc-settings-search-input" role="textbox" aria-label="Search settings" aria-multiline="false" contenteditable="plaintext-only" spellcheck="false" :style="{width:`${searchWidth}px`}" @input="searchInput" @paste="pasteSearch" @focus="searchFocus" @blur="searchBlur" @keydown.enter.prevent @keydown.down.prevent="tree?.focus()" /></div></div></div><div ref="searchControls" class="search-container-widgets"><div class="settings-count-widget monaco-count-badge long">{{activeQuery?`${count} Settings Found`:''}}</div><Toolbar :primary="[{id:'clear',label:'Clear Settings Search Input',icon:'preferences-clear-input',disabled:!query}]" :secondary="searchFilterActions(query)" more-icon="preferences-filter" more-label="Filter Settings" alignment="right" @action="filterAction" /></div></div><div class="settings-header-controls" style="border-color:var(--vscode-settings-headerBorder)"><div class="settings-target-container" @keydown.down="tree?.focus()"><div class="settings-tabs-widget"><ActionBar :actions="tabs" aria-role="tablist" aria-label="Settings Switcher" focus-only-enabled-items @action="id=>target=id as SettingsTarget" /></div></div></div></div>
  <div class="settings-body"><div class="no-results-message" style="color:var(--vscode-editor-foreground)">No Settings Found<span v-if="parsed.tags.length||parsed.ids.length" class="clear-search-filters"> - <a tabindex="0" class="pointer prominent" @click="query=''" @keydown.enter="query=''">Clear Filters</a></span></div><SplitView ref="split" v-model:sizes="sizes" :views="views" orientation="horizontal" class="separator-border" :style="{height:`${treeHeight}px`,'--separator-border':narrow?'transparent':'var(--vscode-settings-sashBorder)'}" @sash-reset="resetSash"><template #default="{item}"><div v-if="item.id==='toc'" class="settings-toc-container"><div class="settings-toc-wrapper" role="navigation" aria-label="Settings"><SettingsToc v-model="category" :groups="toc" :height="treeHeight" /></div></div><div v-else class="settings-tree-container"><div ref="tree" class="monaco-list settings-editor-tree vc-settings-tree mouse-support" role="tree" aria-label="Settings" tabindex="0" @keydown="keyboard"><ScrollableElement ref="scroll" direct-content v-model:scroll-top="scrollTop" :height="treeHeight" horizontal="hidden"><div class="monaco-list-rows" :style="{height:`${totalHeight}px`}"><div v-for="row in renderedRows" :key="row.id" class="monaco-list-row" :class="{focused:focused===row.id}" :style="{height:`${row.height}px`,top:`${row.top}px`}" :data-setting-row="row.id" :data-index="row.index" role="treeitem" :aria-level="row.setting?2:1" :aria-label="row.setting?row.setting.key:row.group.label" @mousedown="focused=row.id"><div class="monaco-tl-row"><SettingsRow v-if="row.setting" :setting="row.setting" :group="row.group.id" :value="settingValue(row.setting)" :configured="Object.hasOwn(values[target],row.setting.key)" :target="target" :all-profiles="allProfiles.includes(row.setting.key)" :other-target="values[target==='user'?'workspace':'user'][row.setting.key]!==undefined?(target==='user'?'workspace':'user'):undefined" @scope="scope(row.setting!,$event)" @toggle-profiles="allProfiles=allProfiles.includes(row.setting!.key)?allProfiles.filter(key=>key!==row.setting!.key):[...allProfiles,row.setting!.key]" @change="change(row.setting!,$event)" @reset="change(row.setting!,undefined,true)" @copy="copy(row.setting!,$event)" @open-json="emit('openJson',row.setting!.key)" @focus="focusRow(row.setting!.key)"/><div v-else class="monaco-tl-contents group-title" style="height:42px"><div class="settings-group-title-label settings-row-inner-container settings-group-level-0" :class="{'settings-group-first':row.index===0}">{{row.group.label}}</div></div></div></div></div></ScrollableElement></div></div></template></SplitView></div>
 </div>
</template>
