<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import ContextMenu from '../src/components/context-menu/ContextMenu.vue';
import List from '../src/components/list/List.vue';
import TreeView from '../src/components/tree/TreeView.vue';
import type { ContextMenuAnchor } from '../src/components/context-menu/types';
import { contextMenuActions, contextMenuItems, longContextMenuActions, contextMenuVariants } from './ContextMenuData';
defineProps<{ theme?: string }>();
const params = new URLSearchParams(location.search);
const menu = ref<InstanceType<typeof ContextMenu>>();
const empty = params.get('empty') === 'true';
const items = empty ? [] : contextMenuItems;
const dynamicVariant = ref<keyof typeof contextMenuVariants>('empty');
const actions = computed(() => params.get('emptyMenu') === 'true' ? [] : params.get('dynamic') === 'true' ? contextMenuVariants[dynamicVariant.value] : params.get('long') === 'true' ? longContextMenuActions : contextMenuActions);
const selection = ref<string[]>([]), treeSelection = ref<string[]>([]), focus = ref<string[]>([]), treeFocus = ref<string[]>([]);
const runs = ref<string[]>([]), visibility = ref<boolean[]>([]), contexts = ref<unknown[]>([]);
let current = 'target', shownContext = 'target';
function visible(value: boolean) { if (value) shownContext = current; visibility.value.push(value); }
function show(kind: string, item: { id: string } | undefined, event: MouseEvent | KeyboardEvent, anchor?: ContextMenuAnchor) {
  event.preventDefault(); event.stopPropagation();
  current = `${kind}:${item?.id || 'empty'}`;
  if (params.get('dynamic') === 'true') dynamicVariant.value = item?.id === 'alpha' ? 'first' : item?.id === 'beta' ? 'second' : 'empty';
  contexts.value.push({ kind, id: item?.id || null, keyboard: event instanceof KeyboardEvent });
  void menu.value?.show(anchor || event as MouseEvent);
}
watch([selection, treeSelection, focus, treeFocus, runs, visibility, contexts], () => {
  (window as any).fixtureState = { selection: selection.value, treeSelection: treeSelection.value, focus: focus.value, treeFocus: treeFocus.value, actions: runs.value, visibility: visibility.value, contexts: contexts.value };
}, { deep: true, immediate: true });
onMounted(() => { (window as any).fixtureReady = true; (window as any).showDynamicMenu = (variant: keyof typeof contextMenuVariants) => { current = `dynamic:${variant}`; dynamicVariant.value = variant; menu.value?.show({ x: 200, y: 100 }); }; (window as any).showPointMenu = (x: number, y: number) => { current = 'point'; menu.value?.show({ x, y }); }; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="display:flex;flex-direction:column;gap:20px">
      <button class="context-target" @contextmenu="show('target', undefined, $event)">Right-click for actions</button>
      <List :items="items" :height="88" aria-label="Context files" v-model:selected-ids="selection" @focus-change="focus = $event ? [$event] : []" @contextmenu="(item,event,anchor) => show('list',item,event,anchor)" />
      <TreeView :nodes="items" :height="88" aria-label="Context tree" v-model:selected-ids="treeSelection" @focus-change="treeFocus = $event ? [$event] : []" @contextmenu="(item,event,anchor) => show('tree',item,event,anchor)" />
      <ContextMenu ref="menu" :actions="actions" :auto-select-first-item="params.get('first') === 'true'" @action="runs.push(`${shownContext}:${$event}`)" @visibility="visible" />
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
