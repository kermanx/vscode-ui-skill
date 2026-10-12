<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import SidebarTitle from '../sidebar-title/SidebarTitle.vue';
import Pane from '../pane/Pane.vue';
import PaneView from '../pane-view/PaneView.vue';
import ListBase from '../list/ListBase.vue';
import ContextMenu from '../context-menu/ContextMenu.vue';
import DelayedTooltip from '../tooltip/DelayedTooltip.vue';
import ExplorerTree from './ExplorerTree.vue';
import ExplorerEditorRowView from './ExplorerEditorRow.vue';
import {
  editorActions,
  editorRows,
  explorerNodes,
  folderActions,
  type ExplorerEditorRow,
} from './explorerModel';
import type { ExplorerProps, ExplorerOpenEvent } from './types';
import type { ContextMenuAnchor } from '../context-menu/types';
const props = withDefaults(defineProps<ExplorerProps>(), {
  editorGroups: () => [],
  height: 500,
  showOpenEditors: true,
  visibleEditors: 9,
  contextActions: () => [],
});
const expanded = defineModel<string[]>('expandedIds', { default: () => [] });
const selected = defineModel<string[]>('selectedIds', { default: () => [] });
const activeEditor = defineModel<string>('activeEditorId', { default: '' });
const openExpanded = defineModel<boolean>('openEditorsExpanded', {
  default: true,
});
const foldersExpanded = defineModel<boolean>('foldersExpanded', {
  default: true,
});
const emit = defineEmits<{
  open: [event: ExplorerOpenEvent];
  close: [id: string, groupId: string];
  unpin: [id: string, groupId: string];
  action: [event: { id: string; groupId?: string; editorId?: string }];
  fileFocus: [id: string | undefined];
  editorFocus: [id: string | undefined];
  editorSelection: [ids: string[]];
  expansion: [event: { section: 'files' | 'editors'; expanded: boolean }];
  contextmenu: [event: { source: 'files'; id?: string }];
}>();
const tree = ref<InstanceType<typeof ExplorerTree>>();
const list = ref<InstanceType<typeof ListBase>>();
const menu = ref<InstanceType<typeof ContextMenu>>();
const dirtyBadge = ref<HTMLElement>();
const editorSelected = ref(activeEditor.value ? [activeEditor.value] : []);
const nodes = computed(() => explorerNodes(props.roots));
const rows = computed(() => editorRows(props.editorGroups));
const dirtyCount = computed(
  () =>
    new Set(
      props.editorGroups.flatMap((group) =>
        group.editors
          .filter((editor) => editor.dirty)
          .map((editor) => editor.path),
      ),
    ).size,
);
const listHeight = computed(
  () => Math.min(Math.max(props.visibleEditors, 1), rows.value.length) * 22,
);
const paneExpanded = computed({
  get: () => ({ editors: openExpanded.value, files: foldersExpanded.value }),
  set: (value) => {
    openExpanded.value = value.editors;
    foldersExpanded.value = value.files;
  },
});
const paneItems = computed(() => [
  ...(props.showOpenEditors
    ? [
        {
          id: 'editors',
          size: 22 + listHeight.value,
          minimumBodySize: listHeight.value,
          maximumBodySize: rows.value.length * 22,
        },
      ]
    : []),
  {
    id: 'files',
    size: Math.max(
      142,
      props.height - 35 - (props.showOpenEditors ? 22 + listHeight.value : 0),
    ),
    minimumBodySize: 120,
  },
]);
const title = computed(
  () =>
    props.workspaceName ||
    (props.roots.length === 1 ? props.roots[0].name : 'Folders'),
);
function toolbarAction(id: string) {
  if (id === 'collapseAll') tree.value?.collapseAll();
  emit('action', { id });
}
function open(
  row: ExplorerEditorRow,
  pinned = false,
  preserveFocus = true,
  sideBySide = false,
) {
  if (row.editor)
    emit('open', {
      id: row.editor.id,
      groupId: row.group.id,
      source: 'editors',
      pinned,
      preserveFocus,
      sideBySide,
    });
}
function editorMouse(event: MouseEvent) {
  if (
    (event.target as HTMLElement).closest('.monaco-action-bar') ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return;
  const id = (event.target as HTMLElement).closest<HTMLElement>(
    '.monaco-list-row',
  )?.dataset.id;
  const row = rows.value.find((row) => row.id === id);
  if (row && event.detail !== 2) open(row, false, true, event.altKey);
}
let editorFocused: string | undefined;
function editorDouble(event: MouseEvent) {
  const id = (event.target as HTMLElement).closest<HTMLElement>(
    '.monaco-list-row',
  )?.dataset.id;
  const row = rows.value.find((row) => row.id === id);
  if (row)
    open(row, true, false, event.altKey || event.ctrlKey || event.metaKey);
}
function editorMiddle(event: MouseEvent) {
  if (event.button !== 1) return;
  const id = (event.target as HTMLElement).closest<HTMLElement>(
    '.monaco-list-row',
  )?.dataset.id;
  const row = rows.value.find((row) => row.id === id);
  if (row?.editor) rowAction('close', row);
}
function editorKey(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.defaultPrevented) {
    const row = rows.value.find((row) => row.id === editorFocused);
    if (row) open(row, false, true, false);
  }
}
function rowAction(id: string, row: ExplorerEditorRow) {
  if (row.editor) {
    if (id === 'close') emit('close', row.editor.id, row.group.id);
    else if (id === 'unpin') emit('unpin', row.editor.id, row.group.id);
  }
  emit('action', { id, groupId: row.group.id, editorId: row.editor?.id });
}
function unsaved() {
  const row = rows.value.find((row) => row.editor?.dirty);
  if (row) open(row, true, false);
}
function context(
  node: any,
  event: MouseEvent | KeyboardEvent,
  anchor?: ContextMenuAnchor,
) {
  emit('contextmenu', { source: 'files', id: node?.id });
  if (anchor) menu.value?.show(anchor);
}
watch(
  activeEditor,
  async (id) => {
    editorSelected.value = id ? [id] : [];
    await nextTick();
    list.value?.setFocus(id || undefined);
    if (id) list.value?.reveal(id);
  },
  { immediate: true },
);
watch(editorSelected, (ids) => emit('editorSelection', ids.slice()));
defineExpose({
  focusFiles: () => tree.value?.focus(),
  focusEditors: () => list.value?.focus(),
  collapseAll: () => toolbarAction('collapseAll'),
});
</script>
<template>
  <div class="vc-explorer" :style="{ height: `${height}px` }">
    <SidebarTitle
      title="Explorer"
      :secondary="[
        { id: 'openEditors', label: 'Open Editors', checked: showOpenEditors },
        { id: 'folders', label: 'Folders', checked: true },
      ]"
      @action="toolbarAction"
    />
    <div
      class="content composite explorer-viewlet"
      :style="{ height: `${height - 35}px` }"
    >
      <PaneView :panes="paneItems" v-model:expanded="paneExpanded">
        <template
          #editors="{ bodySize, expanded: sectionExpanded, setExpanded }"
        >
          <Pane
            v-if="showOpenEditors"
            :expanded="sectionExpanded"
            @update:expanded="setExpanded"
            title="Open Editors"
            :actions="editorActions(editorGroups.length > 1)"
            @action="toolbarAction"
            @change-expansion="
              emit('expansion', { section: 'editors', expanded: $event })
            "
          >
            <template #title
              ><h3 class="title">Open Editors</h3>
              <div class="open-editors-dirty-count-container">
                <div
                  ref="dirtyBadge"
                  class="dirty-count monaco-count-badge long"
                  :class="{ hidden: !dirtyCount }"
                  tabindex="0"
                  role="button"
                  :aria-label="`${dirtyCount} unsaved, open unsaved editor`"
                  style="
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    border: 1px solid var(--vscode-contrastBorder);
                  "
                  @click.stop.prevent="unsaved"
                  @keydown.enter.stop.prevent="unsaved"
                  @keydown.space.stop.prevent="unsaved"
                >
                  {{ dirtyCount ? `${dirtyCount} unsaved` : '' }}
                </div>
              </div></template
            >
            <div
              class="open-editors show-file-icons"
              @click="editorMouse"
              @dblclick="editorDouble"
              @auxclick="editorMiddle"
              @keydown.capture="editorKey"
            >
              <ListBase
                ref="list"
                v-model:selected-ids="editorSelected"
                :items="rows"
                :height="bodySize"
                aria-label="Open Editors"
                @focus-change="
                  editorFocused = $event;
                  emit('editorFocus', $event);
                "
                ><template #default="{ item }"
                  ><ExplorerEditorRowView
                    :row="item as ExplorerEditorRow"
                    :has-dirty="dirtyCount > 0"
                    @action="
                      rowAction($event, item as ExplorerEditorRow)
                    " /></template
              ></ListBase>
            </div>
          </Pane>
        </template>
        <template #files="{ bodySize, expanded: sectionExpanded, setExpanded }">
          <Pane
            :expanded="sectionExpanded"
            @update:expanded="setExpanded"
            :title="title"
            :actions="folderActions"
            @action="toolbarAction"
            @change-expansion="
              emit('expansion', { section: 'files', expanded: $event })
            "
            ><ExplorerTree
              ref="tree"
              v-model:expanded-ids="expanded"
              v-model:selected-ids="selected"
              :nodes="nodes"
              :height="bodySize"
              aria-label="Files Explorer"
              @focus-change="emit('fileFocus', $event)"
              @open="
                (id, pinned, preserveFocus, sideBySide) =>
                  emit('open', {
                    id,
                    source: 'files',
                    pinned,
                    preserveFocus,
                    sideBySide,
                  })
              "
              @contextmenu="context"
          /></Pane>
        </template>
      </PaneView>
    </div>
    <ContextMenu ref="menu" :actions="contextActions" @action="toolbarAction" />
    <DelayedTooltip :target="dirtyBadge" text="Open Unsaved Editor" />
  </div>
</template>
<style src="./seti.css" />
<style src="./explorerviewlet.css" />
<style src="./openeditors.css" />
<style>
.vc-explorer {
  --vscode-icon-circle-filled-content: '\ea71';
  --vscode-icon-circle-filled-font-family: codicon;
  --vscode-icon-pinned-dirty-content: '\ebb2';
  --vscode-icon-pinned-dirty-font-family: codicon;
  background: var(--vscode-sideBar-background);
  color: var(--vscode-sideBar-foreground, var(--vscode-foreground));
}
.vc-explorer .monaco-list .indent-guide {
  border-color: var(--vscode-tree-inactiveIndentGuidesStroke);
}
.vc-explorer .monaco-list .indent-guide.active {
  border-color: var(--vscode-tree-indentGuidesStroke);
}

.vc-theme:is([data-theme='hcDark'], [data-theme='hcLight'])
  .vc-explorer
  .explorer-item,
.vc-theme:is([data-theme='hcDark'], [data-theme='hcLight'])
  .vc-explorer
  .editor-group {
  line-height: 20px;
}
</style>
