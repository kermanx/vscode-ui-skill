<script setup lang="ts">
import { onMounted, ref } from "vue";
import Table from "../src/components/table/Table.vue";
import type { TableHandle } from "../src/components/table/types";
import {
  tableColumns,
  tableRows,
  manyTableRows,
  changedTableRows,
} from "./TableData";
defineProps<{ theme?: string }>();
const table = ref<TableHandle>();
const params = new URLSearchParams(location.search);
const rows = ref(params.get("large") === "true" ? manyTableRows : tableRows),
  columns = ref(tableColumns.map((column) => ({ ...column }))),
  selected = ref<string[]>([]),
  focus = ref<string>();
const height = ref(264),
  events = ref<object[]>([]),
  contexts = ref<string[]>([]);
const multiple = params.get("multiple") !== "false";
function update() {
  rows.value = changedTableRows(rows.value);
}
function constraints() {
  columns.value = columns.value.map((column) =>
    column.id === "source"
      ? { ...column, minimumWidth: 150, maximumWidth: 180 }
      : column,
  );
}
onMounted(() => {
  Object.defineProperty(window, "fixtureState", {
    configurable: true,
    get: () => ({
      focus: focus.value ? [focus.value] : [],
      selection: [...selected.value],
      contexts: [...contexts.value],
      columns: table.value?.getColumnWidths(),
      events: [...events.value],
      scrollTop: table.value?.getScrollTop(),
    }),
  });
  (window as any).fixtureApi = {
    resize: () => table.value?.resizeColumn("source", 40),
    constraints,
    update,
    clear: () => (rows.value = []),
    scroll: () => table.value?.setScrollTop(1000),
    height: () => (height.value = 312),
    focus: () => table.value?.setFocus(rows.value[4]?.id),
  };
  (window as any).fixtureReady = true;
});
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen table-specimen" data-testid="specimen">
      <Table
        ref="table"
        :columns="columns"
        :rows="rows"
        :height="height"
        :multiple="multiple"
        aria-label="Diagnostics"
        v-model:selected-ids="selected"
        @focus-change="focus = $event"
        @contextmenu="
          (row, event) => {
            event.preventDefault();
            if (row) contexts.push(row.id);
          }
        "
        @column-resize="
          (id, width, widths) => events.push({ id, width, widths })
        "
      />
    </div>
    <button class="outside">Move focus outside</button
    ><button class="fixture-update" @click="update">Update rows</button
    ><button class="fixture-clear" @click="rows = []">Clear rows</button
    ><button class="fixture-constraints" @click="constraints">
      Change column constraints
    </button>
  </div>
</template>
<style>
.table-specimen {
  background: var(--vscode-panel-background);
}
</style>
