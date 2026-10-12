<script setup lang="ts">
/* Copyright (c) Microsoft Corporation. Licensed under the MIT License. */
import { computed, ref } from 'vue';
import SplitView from '../split-view/SplitView.vue';
import ListBase from '../list/ListBase.vue';
import HighlightedLabel from '../highlighted-label/HighlightedLabel.vue';
import KeybindingLabel from '../keybinding-label/KeybindingLabel.vue';
import type { SplitViewHandle, SplitViewLayout } from '../split-view/types';
import type { ContextMenuAnchor } from '../context-menu/types';
import type { TableCell, TableColumn, TableRow } from './types';
const props = withDefaults(
  defineProps<{
    columns: readonly TableColumn[];
    rows: readonly TableRow[];
    height?: number;
    ariaLabel?: string;
    multiple?: boolean;
  }>(),
  { height: 264, ariaLabel: 'Table', multiple: true },
);
const selected = defineModel<string[]>('selectedIds', { default: () => [] });
const emit = defineEmits<{
  focusChange: [id: string | undefined];
  contextmenu: [
    row: TableRow | undefined,
    event: MouseEvent | KeyboardEvent,
    anchor?: ContextMenuAnchor,
  ];
  columnResize: [id: string, width: number, widths: number[]];
  scroll: [top: number];
}>();
const element = ref<HTMLElement>(),
  split = ref<SplitViewHandle>(),
  list = ref<InstanceType<typeof ListBase>>();
const widths = ref<number[]>([]);
const views = computed(() =>
  props.columns.map((column) => ({
    id: column.id,
    size: column.weight,
    minimumSize: column.minimumWidth ?? 120,
    maximumSize: column.maximumWidth,
  })),
);
const cell = (value: string | TableCell | undefined): TableCell =>
  typeof value === 'string' ? { text: value } : (value ?? {});
const rowMap = computed(() => new Map(props.rows.map((row) => [row.id, row])));
const items = computed(() =>
  props.rows.map((row) => ({
    id: row.id,
    label:
      row.label ??
      props.columns
        .map((column) => cell(row.cells[column.id]).text ?? '')
        .filter(Boolean)
        .join(', '),
  })),
);
function layout(value: SplitViewLayout) {
  widths.value = value.sizes;
}
function reset(index: number) {
  const totalWeight = props.columns.reduce(
    (sum, column) => sum + column.weight,
    0,
  );
  split.value?.resizeView(
    index,
    (props.columns[index].weight / totalWeight) *
      (element.value?.clientWidth ?? 0),
  );
}
function columnResize(index: number) {
  emit('columnResize', props.columns[index].id, widths.value[index], [
    ...widths.value,
  ]);
}
function resizeColumn(id: string, percentage: number) {
  const index = props.columns.findIndex((column) => column.id === id);
  if (index >= 0)
    split.value?.resizeView(
      index,
      Math.round((percentage / 100) * (element.value?.clientWidth ?? 0)),
    );
}
defineExpose({
  focus: () => list.value?.focus(),
  setFocus: (id?: string) => list.value?.setFocus(id),
  reveal: (id: string) => list.value?.reveal(id),
  resizeColumn,
  getColumnWidths: () => [...widths.value],
  setScrollTop: (top: number) => list.value?.setScrollTop(top),
  getScrollTop: () => list.value?.getScrollTop() ?? 0,
});
</script>
<template>
  <div
    ref="element"
    class="monaco-table vc-table"
    :style="{ height: `${height}px` }"
  >
    <SplitView
      ref="split"
      :views="views"
      orientation="horizontal"
      scrollbar-visibility="hidden"
      :sash-orthogonal-size="height"
      style="height: 24px; line-height: 24px"
      @layout="layout"
      @sash-reset="reset"
      @sash-change="columnResize"
      ><template #default="{ index }"
        ><div class="monaco-table-th" :data-col-index="index">
          {{ columns[index].label }}
        </div></template
      ></SplitView
    >
    <ListBase
      ref="list"
      :items="items"
      :height="height - 24"
      :row-height="24"
      :multiple="multiple"
      :aria-label="ariaLabel"
      v-model:selected-ids="selected"
      @focus-change="emit('focusChange', $event)"
      @contextmenu="
        (item, event, anchor) =>
          emit(
            'contextmenu',
            item ? rowMap.get(item.id) : undefined,
            event,
            anchor,
          )
      "
      @scroll="emit('scroll', $event)"
    >
      <template #default="{ item, index }"
        ><div class="monaco-table-tr">
          <div
            v-for="(column, columnIndex) in columns"
            :key="column.id"
            class="monaco-table-td"
            :data-col-index="columnIndex"
            :style="{ width: `${widths[columnIndex] ?? 0}px` }"
          >
            <slot
              :name="column.id"
              :row="rows[index]"
              :cell="rowMap.get(item.id)!.cells[column.id]"
              :column="column"
              :index="index"
              ><template
                v-if="cell(rowMap.get(item.id)!.cells[column.id]).keybinding"
                ><KeybindingLabel
                  :chords="
                    cell(rowMap.get(item.id)!.cells[column.id]).keybinding
                  "
                  :os="
                    cell(rowMap.get(item.id)!.cells[column.id]).keybindingOS
                  " /></template
              ><template v-else
                ><div
                  v-if="cell(rowMap.get(item.id)!.cells[column.id]).icon"
                  class="severity"
                >
                  <div
                    class="codicon"
                    :class="`codicon-${cell(rowMap.get(item.id)!.cells[column.id]).icon}`"
                  />
                </div>
                <div class="message">
                  <HighlightedLabel
                    :text="
                      cell(rowMap.get(item.id)!.cells[column.id]).text ?? ''
                    "
                    :highlights="
                      cell(rowMap.get(item.id)!.cells[column.id]).highlights
                    " /></div></template
            ></slot> </div></div
      ></template>
    </ListBase>
  </div>
</template>
<style src="./table.css" />
<style>
/* Problems table delegate and cell styles. */
.vc-table .monaco-table-th {
  display: flex;
  font-weight: 600;
  align-items: center;
  padding-left: 10px;
}
.vc-table .monaco-list-row .monaco-table-tr > .monaco-table-td {
  display: flex;
  align-items: center;
  padding-left: 10px;
}
.vc-table .monaco-list-row .monaco-table-tr > .monaco-table-td .highlight {
  font-weight: bold;
}
.vc-table .monaco-list-row .monaco-table-tr > .monaco-table-td > .message {
  overflow: hidden;
  text-overflow: ellipsis;
}
.vc-table .monaco-list-row .monaco-table-tr > .monaco-table-td > .severity {
  display: flex;
}
.vc-table > .monaco-split-view2 .monaco-sash.vertical::before {
  top: 25px;
  height: calc(100% - 24px);
}
.vc-table .vc-list-rows {
  background: none;
}
/* DefaultStyleController table rules, with existing workbench theme tokens. */
.vc-table > .monaco-split-view2,
.vc-table > .monaco-split-view2 .monaco-sash.vertical::before,
.monaco-enable-motion .vc-table:hover > .monaco-split-view2,
.monaco-enable-motion
  .vc-table:hover
  > .monaco-split-view2
  .monaco-sash.vertical::before {
  border-color: var(--vscode-tree-tableColumnsBorder);
}
.monaco-enable-motion .vc-table > .monaco-split-view2,
.monaco-enable-motion
  .vc-table
  > .monaco-split-view2
  .monaco-sash.vertical::before {
  border-color: transparent;
}
.vc-table
  .monaco-list-row[data-parity='odd']:not(.focused):not(.selected):not(:hover)
  .monaco-table-tr,
.vc-table
  .monaco-list:not(:focus)
  .monaco-list-row[data-parity='odd'].focused:not(.selected):not(:hover)
  .monaco-table-tr,
.vc-table
  .monaco-list:not(.focused)
  .monaco-list-row[data-parity='odd'].focused:not(.selected):not(:hover)
  .monaco-table-tr {
  background-color: var(--vscode-tree-tableOddRowsBackground);
}
</style>
