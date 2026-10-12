<!-- Copyright (c) Microsoft Corporation. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, nextTick, onMounted, onUpdated, ref, watch } from 'vue';
import InputBox from '../input-box/InputBox.vue';
import Toggle from '../toggle/Toggle.vue';
import SelectBox from '../select-box/SelectBox.vue';
import Toolbar from '../toolbar/Toolbar.vue';
import SettingsIndicators from './SettingsIndicators.vue';
import DelayedTooltip from '../tooltip/DelayedTooltip.vue';
import { settingLabels } from './settingLabels';
import type { SettingDefinition } from './types';
const props=defineProps<{setting:SettingDefinition;group:string;value:unknown;configured:boolean;target:string;allProfiles:boolean;otherTarget?:'user'|'workspace'}>();
const emit=defineEmits<{change:[value:unknown];reset:[];copy:[kind:'id'|'json'|'url'];openJson:[];focus:[];toggleProfiles:[];scope:[target:'user'|'workspace']}>();
const row=ref<HTMLElement>(),modified=ref<HTMLElement>(),title=ref<HTMLElement>();
const focus=ref(false),hover=ref(false),text=ref(String(props.value??'')),error=ref(props.setting.validator?.(String(props.value??''))||'');
const labels=computed(()=>settingLabels(props.setting,props.group));
const typeClass=computed(()=>props.setting.type==='boolean'?'bool':['integer','number'].includes(props.setting.type)?'number':props.setting.type==='enum'?'enum':props.setting.type==='complex'?'complex':'text');
const options=computed(()=>{const options=[...(props.setting.options||[])];if(!options.some(option=>option.value===props.setting.defaultValue))options.unshift({value:props.setting.defaultValue as string});return options;});
const optionItems=computed(()=>options.value.map(option=>({text:option.label||String(option.value),detail:option.label?String(option.value):undefined,description:option.description,decoratorRight:option.value===props.setting.defaultValue?'default':undefined})));
const selected=computed(()=>Math.max(0,options.value.findIndex(option=>option.value===props.value)));
const actions=computed(()=>[{id:'reset',label:'Reset Setting'},{separator:true as const},{id:'id',label:'Copy Setting ID'},{id:'json',label:'Copy Setting as JSON'},{id:'url',label:'Copy Setting as URL'},...(props.target==='user'?[{separator:true as const},{id:'profiles',label:'Apply Setting to all Profiles',checked:props.allProfiles}]:[])]);
let renderingValue=false;
watch(()=>props.value,value=>{renderingValue=true;text.value=String(value??'');error.value=props.setting.validator?.(text.value)||'';void nextTick(()=>renderingValue=false);});
function input(value:string){if(renderingValue)return;text.value=value;error.value=props.setting.validator?.(value)||'';if(error.value)return;emit('change',props.setting.type==='integer'?Number.parseInt(value,10):props.setting.type==='number'?Number.parseFloat(value):value);}
function decorate(){const input=row.value?.querySelector<HTMLInputElement|HTMLSelectElement>('input,textarea,select');input?.classList.add('setting-control-focus-target');const parent=input?.parentElement;if(error.value)parent?.setAttribute('aria-label',`Validation Error. ${error.value}`);else parent?.removeAttribute('aria-label');}
onMounted(decorate);onUpdated(decorate);
function blur(){void nextTick(()=>{focus.value=!!row.value?.contains(document.activeElement);});}
function run(id:string){if(id==='profiles')emit('toggleProfiles');else if(id==='reset')emit('reset');else if(id==='id'||id==='json'||id==='url')emit('copy',id);}
function descriptionDown(event:MouseEvent){if((event.target as HTMLElement).closest('a'))return;event.preventDefault();event.stopPropagation();emit('change',!props.value);}
function arrow(event:KeyboardEvent){if((event.key==='ArrowUp'||event.key==='ArrowDown')&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey)event.preventDefault();}
</script>
<template>
 <div class="monaco-tl-contents setting-item" :class="`setting-item-${typeClass}`">
  <div ref="row" class="setting-item-contents settings-row-inner-container" :class="{'is-configured':configured,'is-deprecated':!!setting.deprecationMessage,'invalid-input':!!error,focused:focus,mouseover:hover}" :data-key="setting.key" :data-id="`${group}_${setting.key}`.replace(/[./]/g,'_')" @focusin="focus=true;emit('focus')" @focusout="blur">
   <div ref="title" class="setting-item-title" @mouseenter="hover=true" @mouseleave="hover=false">
    <template v-if="setting.type==='boolean'"><span class="setting-item-category">{{ labels.category ? labels.category+': ' : '' }}</span><span class="setting-item-label">{{ labels.label }}</span></template>
    <div v-else class="setting-item-cat-label-container"><span class="setting-item-category">{{ labels.category ? labels.category+': ' : '' }}</span><span class="setting-item-label">{{ labels.label }}</span></div>
    <SettingsIndicators :tags="setting.tags" :all-profiles="allProfiles&&target==='user'" :other-target="otherTarget" :configured="configured" @scope="emit('scope',$event)" />
    <DelayedTooltip :target="title" :text="setting.key+(configured?' - Modified':'')" />
   </div>
   <div v-if="setting.type==='boolean'" class="setting-item-value-description"><div class="setting-item-bool-control" @mousedown.stop><Toggle class="setting-value-checkbox setting-control-focus-target" icon="check" :title="setting.key" :checked="!!value" @change="emit('change',$event)" /></div><div class="setting-item-description" @mousedown="descriptionDown">{{setting.description}}</div></div>
   <div v-else class="setting-item-description">{{setting.description}}</div>
   <div v-if="setting.type==='enum'" class="setting-item-enumDescription" />
   <div ref="modified" class="setting-item-modified-indicator"><DelayedTooltip :target="modified" text="The setting has been configured in the current scope." /></div>
   <div v-if="setting.type!=='boolean'" class="setting-item-value"><div class="setting-item-control" @mousedown.stop>
    <SelectBox v-if="setting.type==='enum'" :model-value="selected" :options="optionItems" custom :aria-label="setting.key" @select="emit('change',options[$event]?.value)" />
    <a v-else-if="setting.type==='complex'" class="edit-in-settings-button setting-control-focus-target" role="button" tabindex="0" :aria-label="`Edit in settings.json: ${setting.key}`" @click.prevent.stop="emit('openJson')" @keydown.enter.prevent.stop="emit('openJson')" @keydown.space.prevent.stop="emit('openJson')">Edit in settings.json</a>
    <InputBox v-else :model-value="text" :aria-label="setting.key" :type="typeClass==='number'?'number':'text'" :step="setting.type==='integer'?'1':setting.type==='number'?'any':undefined" :multiline="setting.type==='multiline'" :max-height="150" :wrap="setting.type==='multiline'" @change="input" @keydown="setting.type==='string'&&arrow($event)" />
   </div></div>
   <div class="setting-item-deprecation-message"><span class="codicon codicon-error" role="img" aria-label="Warning" />{{setting.deprecationMessage}}</div>
   <div class="setting-toolbar-container"><Toolbar :primary="[]" :secondary="actions" more-label="More Actions... " more-icon="settings-more-action" @action="run" /></div>
   <div v-if="['string','number','integer','multiline'].includes(setting.type)" class="setting-item-validation-message" role="status">{{error}}</div>
  </div>
 </div>
</template>
