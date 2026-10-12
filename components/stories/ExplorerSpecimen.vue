<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import Explorer from '../src/components/explorer/Explorer.vue';
import { explorerExamples } from './ExplorerData';
import type { ExplorerExample } from './ExplorerData';
const props = defineProps<{ theme: string }>();
const current = ref<ExplorerExample>(
  structuredClone(
    explorerExamples[
      Number(new URLSearchParams(location.search).get('case') || 0)
    ],
  ),
);
const key = ref(0);
const explorer = ref<InstanceType<typeof Explorer>>();
const selected = ref(current.value.selectedIds || []);
const expanded = ref(current.value.expandedIds || []);
const active = ref(current.value.activeEditorId || '');
const editorsExpanded = ref(current.value.openEditorsExpanded !== false);
const foldersExpanded = ref(current.value.foldersExpanded !== false);
const state: any = { focus: [], selection: [], clicks: 0, escapes: 0 };
function reset() {
  Object.assign(state, {
    actions: [],
    opens: [],
    contexts: [],
    fileFocus: [],
    fileSelection: selected.value.slice(),
    editorFocus: active.value ? [active.value] : [],
    editorSelection: active.value ? [active.value] : [],
    expanded: expanded.value.slice(),
    expansion: [],
  });
}
reset();
function action(event: any) {
  const ids: Record<string, string> = {
    close: 'workbench.action.closeActiveEditor',
    unpin: 'workbench.action.unpinEditor',
    saveGroup: 'workbench.files.action.saveAllInGroup',
    closeGroup: 'workbench.action.closeEditorsAndGroup',
  };
  state.actions.push({ ...event, id: ids[event.id] || event.id });
}
onMounted(() => {
  (window as any).fixtureState = state;
  (window as any).fixtureReady = true;
  (window as any).fixtureExplorer = {
    focusFiles: () => explorer.value?.focusFiles(),
    focusEditors: () => explorer.value?.focusEditors(),
    collapseAll: () => explorer.value?.collapseAll(),
    snapshot: () => structuredClone(state),
  };
  (window as any).fixtureShowExplorer = async (index: number) => {
    current.value = structuredClone(explorerExamples[index]);
    selected.value = current.value.selectedIds || [];
    expanded.value = current.value.expandedIds || [];
    active.value = current.value.activeEditorId || '';
    editorsExpanded.value = current.value.openEditorsExpanded !== false;
    foldersExpanded.value = current.value.foldersExpanded !== false;
    key.value++;
    reset();
    await nextTick();
  };
});
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="props.theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="width: 320px">
      <Explorer
        :key="key"
        ref="explorer"
        v-bind="current"
        v-model:selected-ids="selected"
        v-model:expanded-ids="expanded"
        v-model:active-editor-id="active"
        v-model:open-editors-expanded="editorsExpanded"
        v-model:folders-expanded="foldersExpanded"
        @update:selected-ids="state.fileSelection = $event"
        @update:expanded-ids="state.expanded = $event"
        @file-focus="state.fileFocus = $event ? [$event] : []"
        @editor-focus="state.editorFocus = $event ? [$event] : []"
        @editor-selection="state.editorSelection = $event"
        @open="state.opens.push($event)"
        @action="action"
        @contextmenu="state.contexts.push($event)"
        @expansion="state.expansion.push($event)"
      />
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
