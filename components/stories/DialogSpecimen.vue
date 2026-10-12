<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import Dialog from '../src/components/dialog/Dialog.vue';
import { dialogExamples,dialogProps } from './DialogData';
import type { DialogResult } from '../src/components/dialog/types';
defineProps<{theme?:string}>();
const selected=ref(0),open=ref(false),dialog=ref<InstanceType<typeof Dialog>>();
const state={results:[] as {index:number;result:DialogResult}[],actions:[] as string[],links:[] as string[]};
async function show(index:number){if(open.value){open.value=false;await nextTick();await nextTick();}selected.value=index;await nextTick();document.querySelector<HTMLButtonElement>(`[data-open="${index}"]`)?.focus();open.value=true;await nextTick();await nextTick();}
function result(value:DialogResult){state.results.push({index:selected.value,result:value});(window as any).fixtureOnDialogResult?.();}
onMounted(async()=>{(window as any).fixtureState=state;(window as any).fixtureSetDialogOpen=(value:boolean)=>{open.value=value;};(window as any).fixtureAfterTick=nextTick;(window as any).fixtureOpenDialog=show;(window as any).fixtureDialog=dialog.value;await show(Number(new URLSearchParams(location.search).get('case')||0));(window as any).fixtureReady=true;});
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme||'dark'">
    <div class="specimen" data-testid="specimen" style="display:grid;grid-template-columns:repeat(2,230px);gap:8px;padding:4px;box-sizing:border-box">
      <button v-for="(example,index) in dialogExamples" :key="index" class="outside" :data-open="index" style="margin:0;text-align:left" @click="show(index)">{{ example.name }}</button>
    </div>
    <button class="outside">Move focus outside</button>
    <Dialog ref="dialog" v-model:open="open" v-bind="dialogProps(dialogExamples[selected])" @result="result" @action="state.actions.push($event)">
      <template v-if="dialogExamples[selected].richDetail" #detail><p style="margin:0">Only trust code from authors you know. <a href="#learn" @click.prevent="state.links.push('detail')">Learn about workspace trust</a>.</p></template>
      <template v-if="dialogExamples[selected].customBody" #default><p style="margin:0">The configuration will apply to this workspace.</p><p style="margin:8px 0 0"><a href="#settings" @click.prevent="state.links.push('body')">View settings</a></p></template>
      <template v-if="dialogExamples[selected].footer" #footer><a href="#help" @click.prevent="state.links.push('footer')">Learn more</a></template>
    </Dialog>
  </div>
</template>
