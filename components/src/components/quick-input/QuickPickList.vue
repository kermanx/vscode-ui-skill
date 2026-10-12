<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, ref, watch } from 'vue';
import ScrollableElement from './QuickPickScrollSurface.vue';
import { dropdownPopupHost } from '../dropdown/popupHost';
import Hover from '../hover/Hover.vue';
import QuickPickRowView from './QuickPickRow.vue';
import { rowAriaLabel, type QuickPickRow } from './quickPickModel';
const props = defineProps<{
  rows: QuickPickRow[];
  activeIds: string[];
  selectedIds: string[];
  canSelectMany: boolean;
  enabled: boolean;
  maxHeight: number;
  listId: string;
  ariaLabel?: string;
  open: boolean;
}>();
const emit = defineEmits<{
  activate: [id: string];
  select: [id: string, event: MouseEvent];
  checked: [id: string, checked: boolean];
  button: [row: QuickPickRow, id: string];
  keydown: [event: KeyboardEvent];
}>();
const container = ref<HTMLElement>();
provide(dropdownPopupHost, { container, layer: 2575 });
const element = ref<HTMLElement>();
const scroll = ref<InstanceType<typeof ScrollableElement>>();
const scrollTop = defineModel<number>('scrollTop', { default: 0 });
const focused = ref(false);
const hoveredGroup = ref<string>();
const hoverOpen = ref(false);
const hoverTarget = ref<HTMLElement>();
const hoverText = ref('');
let hoverTimer: ReturnType<typeof setTimeout> | undefined;
let followFocusHover = false;
function showHover(row: QuickPickRow) {
  hoverOpen.value = false;
  const target = element.value?.querySelector<HTMLElement>(
    `[id="${rowId(row)}"] .quick-input-list-entry`,
  );
  if (!target || row.entry.type === 'separator' || !row.entry.tooltip) return;
  hoverTarget.value = target;
  hoverText.value = row.entry.tooltip;
  void nextTick(() => {
    hoverOpen.value = true;
  });
}
function mouseOver(row: QuickPickRow, event: MouseEvent) {
  hoveredGroup.value = row.group?.id;
  if ((event.target as HTMLElement).tagName === 'A') {
    clearTimeout(hoverTimer);
    return;
  }
  if (
    (event.currentTarget as HTMLElement).contains(
      event.relatedTarget as Node,
    ) &&
    (event.relatedTarget as HTMLElement)?.tagName !== 'A'
  )
    return;
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(
    () => showHover(row),
    navigator.platform.includes('Mac') ? 1500 : 500,
  );
}
function mouseOut(event: MouseEvent) {
  hoveredGroup.value = undefined;
  if (
    (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)
  )
    return;
  clearTimeout(hoverTimer);
}
function toggleHover() {
  const row = props.rows.find((row) => row.entry.id === props.activeIds[0]);
  if (!row?.entry.tooltip) return;
  if (hoverOpen.value) {
    hoverOpen.value = false;
    followFocusHover = false;
  } else {
    followFocusHover = true;
    showHover(row);
  }
}
watch(
  () => props.activeIds,
  () => {
    if (followFocusHover) {
      const row = props.rows.find((row) => row.entry.id === props.activeIds[0]);
      if (row) showHover(row);
    }
  },
);
watch(
  () => props.open,
  (open) => {
    if (!open) {
      clearTimeout(hoverTimer);
      hoverOpen.value = false;
      followFocusHover = false;
    }
  },
);
onBeforeUnmount(() => clearTimeout(hoverTimer));

interface RowSlot {
  key: number;
  row: QuickPickRow;
  visible: boolean;
  ariaChecked?: boolean;
}
const slots = ref<RowSlot[]>([]);
let slotSequence = 0;
const rowCache: RowSlot[] = [];
let previousRows: QuickPickRow[] | undefined;

const totalHeight = computed(() =>
  props.rows.reduce((sum, row) => sum + row.height, 0),
);
const height = computed(() => Math.min(totalHeight.value, props.maxHeight));
const renderedRows = computed(() =>
  props.rows.filter(
    (row) =>
      row.top + row.height > scrollTop.value &&
      row.top < scrollTop.value + height.value,
  ),
);
watch(
  renderedRows,
  (visible) => {
    const reset = previousRows !== props.rows;
    previousRows = props.rows;
    const retained = new Map<string, RowSlot>();
    for (const slot of slots.value) {
      if (!slot.visible) continue;
      if (reset || !visible.some((row) => row.entry.id === slot.row.entry.id)) {
        slot.visible = false;
        rowCache.push(slot);
      } else retained.set(slot.row.entry.id, slot);
    }
    const next = visible
      .slice()
      .reverse()
      .map((row) => {
        let slot = retained.get(row.entry.id);
        if (!slot) {
          let cacheIndex = rowCache.length - 1;
          while (
            cacheIndex >= 0 &&
            (rowCache[cacheIndex].row.entry.type === 'separator') !==
              (row.entry.type === 'separator')
          )
            cacheIndex--;
          slot =
            cacheIndex >= 0
              ? rowCache.splice(cacheIndex, 1)[0]
              : { key: ++slotSequence, row, visible: true };
        }
        slot.row = row;
        slot.visible = true;
        if (
          props.canSelectMany &&
          row.entry.type !== 'separator' &&
          row.entry.pickable !== false
        )
          slot.ariaChecked = props.selectedIds.includes(row.entry.id);
        return slot;
      });
    slots.value = [...next.reverse(), ...rowCache];
  },
  { immediate: true },
);
watch(
  () => props.selectedIds,
  () => {
    for (const slot of slots.value)
      if (
        props.canSelectMany &&
        slot.row.entry.type !== 'separator' &&
        slot.row.entry.pickable !== false
      )
        slot.ariaChecked = props.selectedIds.includes(slot.row.entry.id);
  },
);
function rowId(row: QuickPickRow) {
  return `${props.listId}-${row.index}`;
}
function focus() {
  element.value?.focus();
}
function reveal(id: string, relativeTop?: number) {
  const row = props.rows.find((row) => row.entry.id === id);
  if (!row) return;
  let next = scrollTop.value;
  if (relativeTop !== undefined)
    next = row.top - relativeTop * (height.value - row.height);
  else if (row.top < next) next = row.top;
  else if (row.top + row.height > next + height.value)
    next = row.top + row.height - height.value;
  scroll.value?.setScrollPosition({ scrollTop: next });
}
function mouseDown(row: QuickPickRow, event: MouseEvent) {
  if (
    (event.target as HTMLElement).closest('.action-label,.monaco-custom-toggle')
  )
    return;
  focus();
  emit('activate', row.entry.id);
}
function select(row: QuickPickRow, event: MouseEvent) {
  if (
    (event.target as HTMLElement).closest('.action-label,.monaco-custom-toggle')
  )
    return;
  emit('select', row.entry.id, event);
}
function siblings(row: QuickPickRow) {
  return props.rows.filter(
    (candidate) => candidate.group?.id === row.group?.id,
  );
}
function setScrollTop(top: number) {
  scroll.value?.setScrollPosition({ scrollTop: top });
}
async function layout() {
  await nextTick();
  scroll.value?.scanDomNode();
}
defineExpose({
  toggleHover,
  focus,
  reveal,
  layout,
  rowId,
  setScrollTop,
  getHeight: () => height.value,
  getScrollHeight: () => totalHeight.value,
  hasFocus: () => focused.value,
});
</script>
<template>
  <div
    ref="container"
    class="quick-input-list vc-quick-pick-list"
    :style="{ pointerEvents: enabled ? undefined : 'none' }"
  >
    <div
      ref="element"
      :id="listId"
      class="monaco-list mouse-support monaco-tree"
      :class="{
        'element-focused': activeIds.length,
        'selection-single': !canSelectMany && selectedIds.length === 1,
        'selection-multiple': !canSelectMany && selectedIds.length > 1,
        focused,
      }"
      role="listbox"
      tabindex="0"
      :aria-label="ariaLabel"
      :aria-multiselectable="canSelectMany || undefined"
      :aria-activedescendant="
        rows.find((row) => row.entry.id === activeIds[0])
          ? rowId(rows.find((row) => row.entry.id === activeIds[0])!)
          : undefined
      "
      :style="{ height: `${height}px`, maxHeight: `${maxHeight}px` }"
      @focus="focused = true"
      @blur="focused = false"
      @keydown="emit('keydown', $event)"
    >
      <ScrollableElement
        ref="scroll"
        v-model:scroll-top="scrollTop"
        :height="height"
        :content-height="totalHeight"
        horizontal="hidden"
        shadows
        contain-wheel
      >
        <template v-for="slot in slots" :key="slot.key"
          ><div
            v-for="row in [slot.row]"
            :key="slot.key"
            :id="slot.visible ? rowId(row) : undefined"
            :class="{
              'monaco-list-row': slot.visible,
              'vc-quick-pick-cached-row': !slot.visible,
              focused: activeIds.includes(row.entry.id),
              selected: !canSelectMany && selectedIds.includes(row.entry.id),
            }"
            :data-index="rows.indexOf(row)"
            :data-item-id="row.entry.id"
            :role="
              canSelectMany &&
              row.entry.type !== 'separator' &&
              row.entry.pickable !== false
                ? 'checkbox'
                : 'option'
            "
            :aria-label="rowAriaLabel(row)"
            :aria-checked="slot.ariaChecked"
            :aria-selected="
              !canSelectMany ? selectedIds.includes(row.entry.id) : undefined
            "
            :aria-level="row.group ? 2 : 1"
            :aria-setsize="siblings(row).length"
            :aria-posinset="siblings(row).indexOf(row) + 1"
            :style="{
              display: slot.visible ? undefined : 'none',
              top: `${row.top}px`,
              height: `${row.height}px`,
            }"
            @mouseover="mouseOver(row, $event)"
            @mouseout="mouseOut"
            @mousedown="mouseDown(row, $event)"
            @click="select(row, $event)"
            @auxclick.middle="select(row, $event)"
            @contextmenu.prevent="select(row, $event)"
          >
            <div class="monaco-tl-row">
              <div class="monaco-tl-indent" style="width: 0px" />
              <div
                class="monaco-tl-twistie"
                style="width: 0px; padding-left: 0px; display: none"
              />
              <div class="monaco-tl-contents">
                <QuickPickRowView
                  :row="row"
                  :can-select-many="canSelectMany"
                  :checked="selectedIds.includes(row.entry.id)"
                  :focus-inside="
                    hoveredGroup === row.entry.id ||
                    rows.some(
                      (candidate) =>
                        candidate.group?.id === row.entry.id &&
                        activeIds.includes(candidate.entry.id),
                    )
                  "
                  @checked="emit('checked', row.entry.id, $event)"
                  @button="emit('button', row, $event)"
                />
              </div>
            </div></div
        ></template>
      </ScrollableElement>
    </div>
    <Hover
      v-model:open="hoverOpen"
      :target="hoverTarget || null"
      :content="hoverText"
      position="right"
      compact
      show-pointer
    />
  </div>
</template>
<style src="../list/upstream/list.css" />
<style src="../tree/upstream/tree.css" />
<style>
.vc-quick-pick-list .quick-input-list-separator-as-item {
  color: var(--vscode-descriptionForeground);
}
.vc-quick-pick-list .monaco-list-rows {
  background: var(--vscode-quickInput-background);
}
.vc-quick-pick-list .monaco-list-row:hover:not(.focused):not(.selected) {
  background: var(--vscode-list-hoverBackground);
  color: var(--vscode-list-hoverForeground);
  outline: 1px dashed var(--vscode-contrastActiveBorder);
  outline-offset: -1px;
}
.vc-quick-pick-list .monaco-list-row.focused,
.vc-quick-pick-list .monaco-list-row.selected {
  background: var(--vscode-quickInputList-focusBackground);
  color: var(--vscode-quickInputList-focusForeground);
  outline: 1px dotted var(--vscode-contrastActiveBorder);
  outline-offset: -1px;
}
.vc-quick-pick-list .monaco-list:focus .monaco-list-row.focused {
  outline-style: solid;
}
.vc-quick-pick-list .monaco-list:focus .monaco-list-row.selected {
  background: var(--vscode-list-activeSelectionBackground);
  color: var(--vscode-list-activeSelectionForeground);
}
.vc-quick-pick-list .monaco-list-row.focused .codicon {
  color: var(--vscode-quickInputList-focusIconForeground);
}
.vc-quick-pick-list .quick-input-list-entry {
  border-color: var(--vscode-pickerGroup-border);
}
.vc-quick-pick-list .monaco-list > .monaco-scrollable-element {
  box-sizing: border-box;
}
</style>
