<script setup lang="ts">
import { nextTick,onMounted,ref } from 'vue';
import SplitView from '../src/components/split-view/SplitView.vue';
import type { SplitViewHandle,SplitViewItem } from '../src/components/split-view/types';
import type { SashHandle } from '../src/components/sash/types';
import { splitMain,splitStack,splitTriple,splitLabels,splitPaneStyle } from './SplitViewData';
defineProps<{theme?:string}>();
const main=ref<SplitViewHandle>(),stack=ref<SplitViewHandle>(),triple=ref<SplitViewHandle>(),linked=ref<SplitViewHandle>();
const mainSash=ref<SashHandle>(),linkedSash=ref<SashHandle>();
const mainViews=ref(splitMain.map(v=>({...v}))),tripleViews=ref(splitTriple.map(v=>({...v})));
const query=new URLSearchParams(location.search);const proportional=query.get('proportional')!=='false',inverse=query.get('inverse')==='true';
const tripleSizes=ref<number[]>([]);
const height=ref(140),events=ref<object[]>([]);const mounted=ref(true);
function record(id:string,phase:string,index:number){events.value.push({id,phase,index});if(phase==='reset')({main,stack,triple,linked}[id]!.value?.distributeViewSizes());}
function add(){if(tripleViews.value.length===3)tripleViews.value.push({id:'extra',size:70,minimumSize:30});else tripleViews.value.pop();}
function constrain(){mainViews.value=mainViews.value.map(v=>({...v,minimumSize:v.id==='explorer'?130:v.minimumSize,maximumSize:v.id==='explorer'?150:v.maximumSize}));}
function overflow(){tripleViews.value=tripleViews.value.map(v=>({...v,minimumSize:180,maximumSize:300}));}
onMounted(async()=>{await nextTick();mainSash.value=main.value?.getSash(0);linkedSash.value=linked.value?.getSash(0);Object.defineProperty(window,'fixtureState',{configurable:true,get:()=>({main:main.value?.getLayout(),stack:stack.value?.getLayout(),triple:triple.value?.getLayout(),linked:linked.value?.getLayout(),events:events.value})});(window as any).fixtureApi={model:()=>tripleSizes.value=[170,100,110],getRemovedSash:()=>!!triple.value?.getSash(tripleViews.value.length-1),resize:()=>main.value?.resizeView(0,175),collapse:()=>main.value?.setViewVisible(0,false),expand:()=>main.value?.setViewVisible(0,true),distribute:()=>triple.value?.distributeViewSizes(),scroll:()=>triple.value?.setScrollPosition({scrollLeft:85}),add,constrain,overflow,move:()=>{const value=tripleViews.value.shift()!;tripleViews.value.push(value);},resizeStack:()=>height.value=200,unmount:()=>mounted.value=false};(window as any).fixtureReady=true;});
</script>
<template>
 <div class="vc-theme fixture-root" :data-theme="theme||'dark'">
  <div class="specimen button-specimen" data-testid="specimen">
   <div style="height:100px" data-demo="main"><SplitView v-if="mounted" ref="main" :views="mainViews" orientation="horizontal" :proportional-layout="proportional" :inverse-alt-behavior="inverse" :linked-sashes="[linkedSash]" @sash-change="record('main','change',$event)" @sash-reset="record('main','reset',$event)"><template #default="{item}"><div :style="splitPaneStyle">{{splitLabels[item.id]}}</div></template></SplitView></div>
   <div :style="{height:`${height}px`}" data-demo="stack"><SplitView ref="stack" :views="splitStack" :proportional-layout="proportional" :inverse-alt-behavior="inverse" @sash-change="record('stack','change',$event)" @sash-reset="record('stack','reset',$event)"><template #default="{item}"><div :style="splitPaneStyle">{{splitLabels[item.id]}}</div></template></SplitView></div>
   <div style="height:100px" data-demo="triple"><SplitView ref="triple" v-model:sizes="tripleSizes" :views="tripleViews" orientation="horizontal" :proportional-layout="proportional" :inverse-alt-behavior="inverse" @sash-change="record('triple','change',$event)" @sash-reset="record('triple','reset',$event)"><template #default="{item}"><div :style="splitPaneStyle">{{splitLabels[item.id]}}</div></template></SplitView></div>
   <div style="height:44px" data-demo="linked"><SplitView ref="linked" :views="splitMain" orientation="horizontal" :linked-sashes="[mainSash]" @sash-change="record('linked','change',$event)" @sash-reset="record('linked','reset',$event)"><template #default="{item}"><div :style="splitPaneStyle">{{splitLabels[item.id]}}</div></template></SplitView></div>
  </div>
  <button class="outside">Move focus outside</button>
  <button class="fixture-collapse" @click="main?.setViewVisible(0,false)">Collapse Explorer</button><button class="fixture-expand" @click="main?.setViewVisible(0,true)">Restore Explorer</button><button class="fixture-distribute" @click="triple?.distributeViewSizes()">Distribute</button><button class="fixture-add" @click="add">Add / remove</button><button class="fixture-constrain" @click="constrain">Change constraints</button><button class="fixture-overflow" @click="overflow">Overflow</button>
 </div>
</template>
