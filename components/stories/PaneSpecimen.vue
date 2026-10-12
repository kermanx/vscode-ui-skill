<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import Pane from '../src/components/pane/Pane.vue';
import PaneBodySample from './PaneBodySample.vue';
import { paneExamples } from './PaneData';
defineProps<{theme?:string}>();
const examples=ref(paneExamples.map(item=>({...item}))),expanded=ref(paneExamples.map(item=>item.expanded!==false));
const panes=ref<InstanceType<typeof Pane>[]>([]);
const state={expansion:[] as string[],actions:[] as string[],visibility:[] as string[],renders:paneExamples.map(()=>0)};
onMounted(async()=>{await nextTick();(window as any).fixtureState=state;(window as any).fixturePanes=panes.value;(window as any).fixtureUpdatePane=(index:number,props:Record<string,unknown>)=>Object.assign(examples.value[index],props);(window as any).fixtureReady=true;});
function paneProps(example:typeof paneExamples[number]){const {bodyHeight,body,expanded,...props}=example;return props;}
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme||'dark'">
    <div class="specimen" data-testid="specimen" style="display:flex;flex-direction:column;gap:12px;padding:4px;box-sizing:border-box">
      <div v-for="(example,index) in examples" :key="index" :data-index="index" :style="{width:'340px',height:`${(example.headerVisible===false?0:22)+(expanded[index]?example.bodyHeight:0)}px`}">
        <Pane ref="panes" v-bind="paneProps(example)" v-model:expanded="expanded[index]" @change-expansion="state.expansion.push(`${index}:${$event}`)" @action="state.actions.push(`${index}:${$event}`)" @menu-visibility="state.visibility.push(`${index}:${$event}`)">
          <PaneBodySample :index="index" :kind="example.body" :height="example.bodyHeight" @render="state.renders[index]++" />
        </Pane>
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
