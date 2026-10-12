<script setup lang="ts">
import {computed,nextTick,onBeforeUnmount,onMounted,ref} from 'vue';
import QuickPick from '../src/components/quick-input/QuickPick.vue';
import QuickInput from '../src/components/quick-input/QuickInput.vue';
import {quickInitial,quickMode,quickProps,quickKey,profilePrompt,profileError,lineTarget,type WorkbenchQuickMode} from './WorkbenchQuickData';
const props=defineProps<{lines:string[]}>();
const emit=defineEmits<{accept:[mode:WorkbenchQuickMode,value:string[]|string];navigate:[line:number,column:number]}>();
const requested=ref<WorkbenchQuickMode>('files'),value=ref(''),pickOpen=ref(false),inputOpen=ref(false),error=ref('');
const active=ref<string[]>([]),selected=ref<string[]>([]),selection=ref<[number,number]>([0,0]);
const mode=computed(()=>quickMode(requested.value,value.value));
const config=computed(()=>quickProps(mode.value,value.value,props.lines));
async function show(next:WorkbenchQuickMode){
 pickOpen.value=false;inputOpen.value=false;await nextTick();await nextTick();
 requested.value=next;value.value=quickInitial(next);error.value='';active.value=[];selected.value=[];selection.value=[value.value.length,value.value.length];
 await nextTick();if(next==='input')inputOpen.value=true;else pickOpen.value=true;
}
async function accept(ids:string[]){
 if(mode.value==='line'){const target=lineTarget(value.value,props.lines);if(!target.line)return;pickOpen.value=false;await nextTick();await nextTick();emit('navigate',target.line,target.column!);return;}
 const acceptedMode=mode.value;pickOpen.value=false;await nextTick();await nextTick();emit('accept',acceptedMode,ids);
}
async function acceptInput(){error.value=profileError(value.value);if(error.value)return;const result=value.value.trim();inputOpen.value=false;await nextTick();await nextTick();emit('accept','input',result);}
function keydown(event:KeyboardEvent){if(event.defaultPrevented)return;const next=quickKey(event);if(next){event.preventDefault();void show(next);}}
onMounted(()=>window.addEventListener('keydown',keydown));onBeforeUnmount(()=>window.removeEventListener('keydown',keydown));
defineExpose({show});
</script>
<template>
 <QuickPick v-model:open="pickOpen" v-model:value="value" v-model:active-ids="active" v-model:selected-ids="selected" v-bind="config" :value-selection="selection" @accept="accept($event.selectedIds)" />
 <QuickInput v-model:open="inputOpen" v-model:value="value" title="New Workspace Profile" placeholder="Profile name" :prompt="profilePrompt" :validation-message="error" :severity="error?'error':'ignore'" @change="error=''" @accept="acceptInput" />
</template>
