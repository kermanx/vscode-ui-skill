<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import SettingsEditor from '../src/components/settings/SettingsEditor.vue';
import {settingsGroups,initialSettingsValues} from './SettingsData';
import type {SettingChange,SettingsGroup,SettingsTarget} from '../src/components/settings/types';
const props=withDefaults(defineProps<{theme?:string}>(),{theme:'dark'});
const params=new URLSearchParams(location.search),width=ref(Number(params.get('width')||880)),height=ref(Number(params.get('height')||620));
const allProfiles=ref<string[]>([]);
const values=ref(structuredClone(initialSettingsValues)),target=ref<SettingsTarget>('user'),query=ref(''),category=ref(''),editor=ref<InstanceType<typeof SettingsEditor>>();
const state=reactive({query:'',target:'user',category:'',values:values.value,changes:[] as unknown[],opens:[] as string[],copies:[] as string[],links:[] as string[],focus:'',allProfiles:allProfiles.value});
watch([query,target,category,values,allProfiles],()=>{Object.assign(state,{query:query.value,target:target.value,category:category.value,values:values.value,allProfiles:allProfiles.value});},{deep:true,flush:'sync'});
function change(event:SettingChange){state.changes.push({...event,value:event.value??null});}
onMounted(()=>{Object.assign(window,{fixtureState:state,fixtureReady:true,fixtureApi:{setSearchImeEnabled:(enabled:boolean)=>editor.value?.setSearchImeEnabled(enabled),resize:(nextWidth:number,nextHeight:number)=>{width.value=nextWidth;height.value=nextHeight;},focus:()=>editor.value?.focus(),query:(value:string)=>query.value=value,reveal:(key:string)=>editor.value?.reveal(key),resetCategory:()=>category.value=''}});});
</script>
<template><div class="vc-theme fixture-root" :data-theme="props.theme"><div class="specimen" data-testid="specimen" :style="{width:`${width}px`,height:`${height}px`}"><SettingsEditor ref="editor" :groups="settingsGroups as SettingsGroup[]" :height="height" v-model:values="values" v-model:all-profiles="allProfiles" v-model:target="target" v-model:query="query" v-model:category="category" @change="change" @open-json="state.opens.push($event)" @copy="state.copies.push($event)" @focus="state.focus=$event" /></div><button class="outside">Move focus outside</button></div></template>
