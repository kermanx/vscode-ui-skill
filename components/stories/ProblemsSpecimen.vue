<script setup lang="ts">
import { onMounted, ref } from "vue";
import Problems from "../src/components/problems/Problems.vue";
import type {
  ProblemItem,
  ProblemOpenEvent,
  ProblemSeverity,
  ProblemsHandle,
} from "../src/components/problems/types";
import { manyProblems, problemItems } from "./ProblemsData";
defineProps<{ theme?: string }>();
const params = new URLSearchParams(location.search),
  width = Number(params.get("width") || 720);
const items = ref<ProblemItem[]>(
  structuredClone(
    params.has("empty")
      ? []
      : params.has("large")
      ? manyProblems()
      : problemItems
  )
);
const problems = ref<ProblemsHandle>(),
  filter = ref(""),
  severities = ref<ProblemSeverity[]>(["error", "warning", "info"]),
  expanded = ref<string[]>([]),
  selected = ref<string[]>([]),
  collapsed = ref<string[]>([]);
const opens = ref<object[]>([]),
  actions = ref<object[]>([]),
  links = ref<string[]>([]);
function opened(event: ProblemOpenEvent) {
  const { id, location, preserveFocus, pinned, sideBySide } = event;
  opens.value.push({
    id,
    resource: location.resource,
    line: location.line,
    column: location.column,
    preserveFocus,
    pinned,
    sideBySide,
  });
}
onMounted(() => {
  Object.defineProperty(window, "fixtureState", {
    configurable: true,
    get: () => ({
      filter: filter.value,
      severities: [...severities.value].sort(),
      expanded: [...expanded.value].sort(),
      selected: [...selected.value],
      collapsed: [...collapsed.value].sort(),
      focus: problems.value?.getFocus() ? [problems.value.getFocus()] : [],
      opens: [...opens.value],
      actions: [...actions.value],
      links: [...links.value],
    }),
  });
  (window as any).fixtureApi = {
    focus: () => problems.value?.focus(),
    collapseAll: () => problems.value?.collapseAll(),
    empty: () => (items.value = []),
    reveal: (id: string) => problems.value?.reveal(id),
  };
  (window as any).fixtureReady = true;
});
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div
      class="specimen"
      data-testid="specimen"
      :style="{ width: `${width}px` }"
    >
      <Problems
        ref="problems"
        v-model:filter="filter"
        v-model:severities="severities"
        v-model:expanded-ids="expanded"
        v-model:selected-ids="selected"
        v-model:collapsed-message-ids="collapsed"
        :items="items"
        :height="320"
        @open="opened"
        @action="(id, item) => actions.push({ id, problem: item.id })"
        @link="(href) => links.push(href)"
      />
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
