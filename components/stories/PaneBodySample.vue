<script setup lang="ts">
import { onMounted, ref } from 'vue';
import InputBox from '../src/components/input-box/InputBox.vue';
import Button from '../src/components/button/Button.vue';
import TreeView from '../src/components/tree/TreeView.vue';
import { paneBodyStyle, paneFiles } from './PaneData';
const props=defineProps<{ index:number; kind:'input'|'welcome'|'files'; height:number }>();
const emit=defineEmits<{render:[]}>();
const text=ref(''),count=ref(0),selection=ref<string[]>([]);
onMounted(()=>emit('render'));
</script>
<template>
  <TreeView v-if="kind === 'files'" :nodes="paneFiles" :height="height" aria-label="Open editor files" v-model:selected-ids="selection" />
  <div v-else :style="paneBodyStyle">
    <div v-if="kind === 'input'" style="width:178px"><InputBox v-model="text" :aria-label="`Pane input ${index}`" placeholder="Retained input" /></div>
    <span v-else>No items to display.</span>
    <Button :label="`Count ${count}`" @click="count++" style="width:72px" />
  </div>
</template>
