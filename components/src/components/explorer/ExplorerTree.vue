<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import '../action-bar/actionbar.css';
import { computed, nextTick, ref, useId, watch, onBeforeUnmount } from 'vue';
import { useTree } from '../tree/useTree';
import type { TreeNode, TreeAction } from '../tree/types';
import ExplorerResourceLabel from './ExplorerResourceLabel.vue';
import type { ExplorerTreeNode } from './explorerModel';
import { isContextMenuKey } from '../../internal/contextMenuKeyboard';
import type { ContextMenuAnchor } from '../context-menu/types';
import {
  StandardWheelEvent,
  type IMouseWheelEvent,
} from '../../internal/standardWheelEvent';

const props = withDefaults(
  defineProps<{
    nodes: readonly ExplorerTreeNode[];
    ariaLabel?: string;
    height?: number;
    multiple?: boolean;
    expandOnLabel?: boolean;
  }>(),
  { ariaLabel: 'Tree', height: 264, multiple: true, expandOnLabel: true },
);
const expanded = defineModel<string[]>('expandedIds', { default: () => [] });
const selected = defineModel<string[]>('selectedIds', { default: () => [] });
const emit = defineEmits<{
  focusChange: [id: string | undefined];
  contextmenu: [
    node: TreeNode | undefined,
    event: MouseEvent | KeyboardEvent,
    anchor?: ContextMenuAnchor,
  ];
  open: [
    id: string,
    pinned: boolean,
    preserveFocus: boolean,
    sideBySide: boolean,
  ];
}>();
const element = ref<HTMLElement>();
const viewport = ref<HTMLElement>();
const scrollTop = ref(0);
const hovering = ref(false);
const dragging = ref(false);
const scrolling = ref(false);
let scrollTimer: ReturnType<typeof setTimeout>;
const instanceId = useId();
const rowId = (id: string) => `${instanceId}-${encodeURIComponent(id)}`;
function setScroll(top: number) {
  const bounded = Math.max(0, Math.min(totalHeight.value - props.height, top));
  scrollTop.value = bounded;
  if (viewport.value) viewport.value.scrollTop = bounded;
}
function reveal(index: number) {
  if (index < 0) return;
  const top = index * 22;
  if (top < scrollTop.value) setScroll(top);
  else if (top + 22 > scrollTop.value + props.height)
    setScroll(top + 22 - props.height);
}
const tree = useTree(props, expanded, selected, element, reveal, (id) =>
  emit('focusChange', id),
);
const { rows, focused, activeGuides, expandedSet } = tree;
const selectedSet = computed(() => new Set(selected.value));
const totalHeight = computed(() => rows.value.length * 22 + 22);
const first = computed(() => Math.max(0, Math.floor(scrollTop.value / 22) - 1));
const renderedRows = computed(() =>
  rows.value.slice(
    first.value,
    Math.ceil((scrollTop.value + props.height) / 22) + 1,
  ),
);
const hasScrollbar = computed(() => totalHeight.value > props.height);
const thumbHeight = computed(() =>
  Math.max(20, Math.floor((props.height * props.height) / totalHeight.value)),
);
const thumbRatio = computed(
  () => (props.height - thumbHeight.value) / (totalHeight.value - props.height),
);
const thumbTop = computed(() => Math.round(scrollTop.value * thumbRatio.value));
const activeDescendant = computed(() =>
  renderedRows.value.some((row) => row.node.id === focused.value)
    ? rowId(focused.value!)
    : undefined,
);
watch(totalHeight, () => nextTick(() => setScroll(scrollTop.value)));

let contextKeyDown = false;
function keyup(event: KeyboardEvent) {
  contextKeyDown = false;
  if (!isContextMenuKey(event)) return;
  event.preventDefault();
  event.stopPropagation();
  const item = rows.value.find((row) => row.node.id === focused.value)?.node;
  const anchor = focused.value
    ? document.getElementById(rowId(focused.value)) || element.value
    : element.value;
  emit('contextmenu', item, event, anchor);
}
function contextmenu(event: MouseEvent) {
  if (contextKeyDown) return;
  const id = (event.target as HTMLElement).closest<HTMLElement>(
    '.monaco-list-row',
  )?.dataset.id;
  tree.focus(id);
  const item = rows.value.find((row) => row.node.id === focused.value)?.node;
  emit('contextmenu', item, event, event);
}
function keydown(event: KeyboardEvent) {
  contextKeyDown = isContextMenuKey(event);
  if (contextKeyDown) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (
    event.key === 'Tab' &&
    event.target === element.value &&
    !event.shiftKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    focused.value
  ) {
    const row = document.getElementById(rowId(focused.value));
    const action = row?.querySelector<HTMLElement>('[tabindex="0"]');
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      action.focus();
      return;
    }
  }
  tree.keydown(event, scrollTop.value, props.height, setScroll);
  if (event.key === 'Enter') {
    const row = rows.value.find((row) => row.node.id === focused.value);
    if (row && !row.node.children && !event.shiftKey)
      emit('open', row.node.id, false, true, false);
  }
}

function scroll() {
  scrollTop.value = viewport.value?.scrollTop ?? 0;
  scrolling.value = true;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    scrolling.value = false;
  }, 500);
}
function wheel(event: WheelEvent) {
  const normalized = new StandardWheelEvent(
    event as unknown as IMouseWheelEvent,
  );
  let deltaY = normalized.deltaY;
  if (Math.abs(normalized.deltaX) > Math.abs(deltaY)) deltaY = 0;
  if (!navigator.platform.includes('Mac') && event.shiftKey) deltaY = 0;
  if (event.altKey) deltaY *= 5;
  const delta = 50 * deltaY;
  const previous = scrollTop.value;
  setScroll(previous - (delta < 0 ? Math.floor(delta) : Math.ceil(delta)));
  // Consume wheel events whenever the content needs a scrollbar.
  if (hasScrollbar.value || previous !== scrollTop.value) {
    event.preventDefault();
    event.stopPropagation();
  }
}
function scrollbarDown(event: PointerEvent) {
  event.preventDefault();
  const track = event.currentTarget as HTMLElement;
  const onThumb = (event.target as HTMLElement).classList.contains(
    'vc-tree-thumb',
  );
  if (!onThumb)
    setScroll(
      (event.clientY -
        track.getBoundingClientRect().top -
        thumbHeight.value / 2) /
        thumbRatio.value,
    );
  const start = event.clientY,
    sliderPosition = thumbTop.value;
  dragging.value = true;
  track.setPointerCapture(event.pointerId);
  const move = (e: PointerEvent) =>
    setScroll(
      Math.round((sliderPosition + e.clientY - start) / thumbRatio.value),
    );
  const up = () => {
    dragging.value = false;
    track.removeEventListener('pointermove', move);
    track.removeEventListener('pointerup', up);
    track.removeEventListener('lostpointercapture', up);
  };
  track.addEventListener('pointermove', move);
  track.addEventListener('pointerup', up);
  track.addEventListener('lostpointercapture', up);
}
defineExpose({
  focus: () => element.value?.focus(),
  reveal: (id: string) =>
    reveal(rows.value.findIndex((row) => row.node.id === id)),
  collapseAll: () => {
    expanded.value = [];
  },
});
onBeforeUnmount(() => clearTimeout(scrollTimer));
</script>

<template>
  <div class="explorer-folders-view file-icon-themable-tree show-file-icons">
    <div
      ref="element"
      class="vc-tree monaco-list mouse-support"
      :class="{ 'element-focused': focused }"
      role="tree"
      tabindex="0"
      :style="{ height: `${height}px` }"
      :aria-label="ariaLabel"
      :aria-multiselectable="multiple || undefined"
      :aria-activedescendant="activeDescendant"
      @mouseenter="hovering = true"
      @mouseleave="hovering = false"
      @keydown="keydown"
      @keyup="keyup"
      @contextmenu="contextmenu"
      @mousedown="element?.focus()"
      @wheel="wheel"
    >
      <div
        ref="viewport"
        class="vc-tree-viewport monaco-scrollable-element"
        @scroll="scroll"
        @click.self="tree.blank()"
      >
        <div
          class="vc-tree-rows monaco-list-rows"
          :style="{ height: `${totalHeight}px` }"
          @click.self="tree.blank()"
        >
          <div
            v-for="(row, i) in renderedRows"
            :id="rowId(row.node.id)"
            :key="row.node.id"
            :data-id="row.node.id"
            class="vc-tree-row monaco-list-row vc-tree-row-layout"
            :class="{
              focused: focused === row.node.id,
              selected: selectedSet.has(row.node.id),
            }"
            :style="{
              top: `${(first + i) * 22}px`,
              height: '22px',
              lineHeight: '22px',
            }"
            role="treeitem"
            :aria-label="row.node.label"
            :aria-level="row.depth"
            :aria-posinset="row.position"
            :aria-setsize="row.setSize"
            :aria-selected="selectedSet.has(row.node.id)"
            :aria-expanded="
              row.node.children?.length
                ? expandedSet.has(row.node.id)
                : undefined
            "
            @click="
              tree.click(
                row,
                $event,
                ($event.target as HTMLElement).classList.contains(
                  'monaco-tl-twistie',
                ),
              );
              if (
                !row.node.children &&
                $event.detail !== 2 &&
                !($event.ctrlKey || $event.metaKey || $event.shiftKey)
              )
                emit('open', row.node.id, false, true, $event.altKey);
            "
            @dblclick="
              !row.node.children &&
              emit(
                'open',
                row.node.id,
                true,
                false,
                $event.altKey || $event.ctrlKey || $event.metaKey,
              )
            "
            @auxclick="
              if ($event.button === 1) tree.click(row, $event, false);
              $event.button === 1 &&
                !row.node.children &&
                emit(
                  'open',
                  row.node.id,
                  true,
                  true,
                  $event.altKey || $event.ctrlKey || $event.metaKey,
                );
            "
          >
            <div class="monaco-tl-row vc-tree-content-layout">
              <div
                class="monaco-tl-indent"
                :style="{ width: `${(row.depth - 1) * 8}px` }"
                aria-hidden="true"
              >
                <div
                  v-for="ancestor in row.ancestors"
                  :key="ancestor"
                  class="indent-guide"
                  style="width: 8px"
                  :class="{ active: activeGuides.has(ancestor) }"
                />
              </div>
              <div
                class="monaco-tl-twistie"
                :class="{
                  codicon: row.node.children?.length,
                  'codicon-chevron-down': row.node.children?.length,
                  collapsible: row.node.children?.length,
                  collapsed: !expandedSet.has(row.node.id),
                }"
                :style="{ paddingLeft: `${row.depth * 8}px` }"
                aria-hidden="true"
              />
              <div class="monaco-tl-contents">
                <ExplorerResourceLabel
                  :name="row.node.label"
                  :path="(row.node as ExplorerTreeNode).resource.path"
                  :kind="
                    (row.node as ExplorerTreeNode).root
                      ? 'root'
                      : row.node.children
                        ? 'folder'
                        : 'file'
                  "
                  :language="(row.node as ExplorerTreeNode).resource.language"
                  :decoration="
                    (row.node as ExplorerTreeNode).resource.decoration
                  "
                  :cut="(row.node as ExplorerTreeNode).resource.cut"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="hasScrollbar"
        class="vc-tree-scrollbar"
        :class="{ visible: hovering || dragging || scrolling }"
        @pointerdown="scrollbarDown"
      >
        <div
          class="vc-tree-thumb"
          :class="{ active: dragging }"
          :style="{ height: `${thumbHeight}px`, top: `${thumbTop}px` }"
        />
      </div>
      <div v-if="scrollTop > 0" class="vc-tree-shadow" />
      <div v-if="scrollTop > 0" class="vc-tree-shadow vc-tree-shadow-corner" />
    </div>
  </div>
</template>

<style src="../tree/upstream/list.css" />
<style src="../tree/upstream/tree.css" />
<style src="../tree/upstream/scrollbars.css" />
<style src="../tree/upstream/iconlabel.css" />
<style src="../tree/upstream/views.css" />
<style src="../tree/tree.css" />
