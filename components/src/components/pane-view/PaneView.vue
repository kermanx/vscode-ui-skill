<!-- Copyright (c) Microsoft Corporation. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import SplitView from '../split-view/SplitView.vue';
import type { PaneViewItem } from './types';
const props = defineProps<{ panes: readonly PaneViewItem[] }>();
const expanded = defineModel<Record<string, boolean>>('expanded', { default: () => ({}) });
const sizes = defineModel<number[]>('sizes', { default: () => [] });
const root = ref<HTMLElement>(), split = ref<InstanceType<typeof SplitView>>();
const animated = ref(false);
const cached = new Map<string, number>();
let animationTimer: ReturnType<typeof setTimeout>;
const isExpanded = (item: PaneViewItem) => !item.headerVisible && item.headerVisible !== undefined || expanded.value[item.id] !== false;
const constraints = (item: PaneViewItem, open = isExpanded(item)) => {
  const header = item.headerVisible === false ? 0 : 22;
  return { minimumSize: header + (open ? item.minimumBodySize ?? 120 : 0), maximumSize: open ? header + (item.maximumBodySize ?? Infinity) : header };
};
const views = computed(() => props.panes.map(item => ({id:item.id, size:item.size, ...constraints(item)})));
function setExpanded(id: string, value: boolean) {
  const index = props.panes.findIndex(item => item.id === id);
  if (index < 0 || (expanded.value[id] !== false) === value) return;
  if (!value) cached.set(id, split.value?.getViewSize(index) ?? props.panes[index].size);
  expanded.value = { ...expanded.value, [id]: value };
  split.value?.updateView(index, constraints(props.panes[index],value), value ? cached.get(id) : undefined);
  animated.value = true;
  clearTimeout(animationTimer);
  animationTimer = setTimeout(() => { animated.value = false; }, 200);
}
watch(() => props.panes, () => nextTick(() => {
  for (const item of props.panes) if (!(item.id in expanded.value)) expanded.value = {...expanded.value, [item.id]:true};
}), {deep:true});
function keydown(event: KeyboardEvent) {
  if (!(event.target instanceof HTMLElement) || !event.target.classList.contains('pane-header')) return;
  const offset = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
  if (!offset) return;
  const headers = [...root.value!.querySelectorAll<HTMLElement>('.pane-header')];
  const index = headers.indexOf(event.target);
  headers[Math.max(0, Math.min(headers.length - 1, index + offset))]?.focus();
}
onBeforeUnmount(() => clearTimeout(animationTimer));
defineExpose({setExpanded, resizePane:(id:string,size:number)=>split.value?.resizeView(props.panes.findIndex(item=>item.id===id),size), getSizes:()=>split.value?.getLayout().sizes || []});
</script>
<template>
  <div ref="root" class="monaco-pane-view vc-pane-view" :class="{animated}" @keydown="keydown">
    <SplitView ref="split" :views="views" sequential-initialization v-model:sizes="sizes">
      <template v-for="item in panes" #[item.id]="{size}">
        <slot :name="item.id" :size="size" :body-size="Math.max(0,size-(item.headerVisible === false ? 0 : 22))" :expanded="expanded[item.id] !== false" :set-expanded="(value:boolean)=>setExpanded(item.id,value)" />
      </template>
    </SplitView>
  </div>
</template>
<style>
.vc-pane-view > .monaco-split-view2 .split-view-view > .vc-pane { height:100%; }
/* Pane adds a component boundary between a split view and its native pane root. */
.vc-pane-view > .monaco-split-view2 .split-view-view:first-of-type > .vc-pane > .pane > .pane-header { border-top:none !important; }
</style>
