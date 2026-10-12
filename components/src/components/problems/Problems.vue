<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
} from 'vue';
import ScrollableElement from '../scrollable-element/ScrollableElement.vue';
import ProblemsFilter from './ProblemsFilter.vue';
import ProblemRow from './ProblemRow.vue';
import { lines, problemTree, resourceId, type ProblemNode } from './model';
import { useProblemTree } from './useProblemTree';
import type {
  ProblemItem,
  ProblemOpenEvent,
  ProblemSeverity,
  ProblemsHandle,
} from './types';
const props = withDefaults(
  defineProps<{ items: readonly ProblemItem[]; height?: number }>(),
  { height: 320 },
);
const filter = defineModel<string>('filter', { default: '' });
const severities = defineModel<ProblemSeverity[]>('severities', {
  default: () => ['error', 'warning', 'info'],
});
// Resource IDs are `resource:${filePath}`; marker and related IDs come from the items.
const expanded = defineModel<string[]>('expandedIds', { default: () => [] });
const selected = defineModel<string[]>('selectedIds', { default: () => [] });
const collapsedMessages = defineModel<string[]>('collapsedMessageIds', {
  default: () => [],
});
const emit = defineEmits<{
  open: [event: ProblemOpenEvent];
  action: [id: string, item: ProblemItem];
  link: [href: string, item: ProblemItem];
  focusChange: [id: string | undefined];
}>();
const root = ref<HTMLElement>(),
  element = ref<HTMLElement>(),
  filterElement = ref<InstanceType<typeof ProblemsFilter>>(),
  scrollable = ref<InstanceType<typeof ScrollableElement>>();
const width = ref(720),
  scrollTop = ref(0),
  appliedFilter = ref(filter.value),
  filterHeight = ref(44);
const nodes = computed(() =>
  problemTree(props.items, appliedFilter.value, severities.value),
);
const count = computed(() =>
  nodes.value.reduce((total, node) => total + (node.children?.length || 0), 0),
);
const bodyHeight = computed(() =>
  Math.max(0, props.height - filterHeight.value),
);
const rowHeight = (node: ProblemNode) =>
  node.kind === 'marker' && !collapsedMessages.value.includes(node.id)
    ? lines(node.item!.message).length * 22
    : 22;
const tree = useProblemTree(
  {
    get nodes() {
      return nodes.value;
    },
    multiple: true,
    expandOnLabel: true,
  },
  expanded,
  selected,
  element,
  revealIndex,
  (id) => emit('focusChange', id),
  rowHeight,
);
const { rows, focused, expandedSet, activeGuides } = tree;
const positioned = computed(() => {
  let top = 0;
  return rows.value.map((row) => {
    const height = rowHeight(row.node),
      result = { ...row, top, height };
    top += height;
    return result;
  });
});
const totalHeight = computed(() =>
  positioned.value.reduce((total, row) => total + row.height, 0),
);
const rendered = computed(() =>
  positioned.value.filter(
    (row) =>
      row.top + row.height >= scrollTop.value - 22 &&
      row.top <= scrollTop.value + bodyHeight.value + 22,
  ),
);
const instance = useId(),
  rowId = (id: string) => `${instance}-${encodeURIComponent(id)}`;
function setScroll(top: number) {
  scrollTop.value = Math.max(
    0,
    Math.min(totalHeight.value - bodyHeight.value, top),
  );
}
function revealIndex(index: number) {
  const row = positioned.value[index];
  if (!row) return;
  if (row.top < scrollTop.value) setScroll(row.top);
  else if (row.top + row.height > scrollTop.value + bodyHeight.value)
    setScroll(row.top + row.height - bodyHeight.value);
}
function open(node: ProblemNode, event: MouseEvent | KeyboardEvent) {
  if (node.kind === 'resource') return;
  const pointer = event instanceof MouseEvent;
  emit('open', {
    id: node.id,
    location: node.related || node.item!,
    preserveFocus: pointer && event.detail !== 2,
    pinned: pointer ? event.detail === 2 || event.button === 1 : true,
    sideBySide: pointer ? event.altKey : event.ctrlKey || event.metaKey,
  });
}
function click(row: (typeof rows.value)[number], event: MouseEvent) {
  if (
    (event.target as HTMLElement).closest(
      '.actions,.multiline-actions,.monaco-link',
    )
  )
    return;
  const twistie = (event.target as HTMLElement).classList.contains(
    'monaco-tl-twistie',
  );
  tree.click(row, event, twistie);
  if (!twistie && !event.ctrlKey && !event.metaKey && !event.shiftKey)
    open(row.node, event);
}
function keydown(event: KeyboardEvent) {
  if (event.target !== element.value) return;
  if (event.key === 'Escape') {
    if (selected.value.length > 1) {
      selected.value = focused.value ? [focused.value] : [];
      const node = tree.all.value.get(focused.value || '')?.node;
      if (node && node.kind !== 'resource')
        emit('open', {
          id: node.id,
          location: node.related || node.item!,
          preserveFocus: true,
          pinned: false,
          sideBySide: false,
        });
    } else {
      selected.value = [];
      tree.focus();
    }
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const previous = focused.value,
    followSelection =
      selected.value.length <= 1 && selected.value.join() === (previous || '');
  tree.keydown(event, scrollTop.value, bodyHeight.value, setScroll);
  const node = tree.all.value.get(focused.value || '')?.node;
  if (event.key === 'Enter') {
    if (node?.kind === 'resource') {
      const row = tree.all.value.get(node.id);
      if (row) tree.toggle(row);
    }
    if (node) open(node, event);
  } else if (
    [
      'ArrowDown',
      'ArrowUp',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageDown',
      'PageUp',
    ].includes(event.key) &&
    followSelection &&
    previous !== focused.value
  ) {
    selected.value = focused.value ? [focused.value] : [];
    if (node && node.kind !== 'resource')
      emit('open', {
        id: node.id,
        location: node.related || node.item!,
        preserveFocus: true,
        pinned: false,
        sideBySide: false,
      });
  }
}
function multiline(id: string) {
  collapsedMessages.value = collapsedMessages.value.includes(id)
    ? collapsedMessages.value.filter((x) => x !== id)
    : [...collapsedMessages.value, id];
}
function clearFilters() {
  filter.value = '';
  appliedFilter.value = '';
  severities.value = ['error', 'warning', 'info'];
}
function aria(node: ProblemNode) {
  if (node.kind === 'resource')
    return `${
      props.items.filter((item) => item.resource === node.resource).length
    } problems in file ${node.label} of folder ${node.resource.slice(
      0,
      node.resource.lastIndexOf('/'),
    )}`;
  if (node.related)
    return `${node.related.message} at line ${
      node.related.line
    } and character ${node.related.column} in ${node.resource
      .split('/')
      .at(-1)}`;
  const item = node.item!;
  return `${item.severity[0].toUpperCase() + item.severity.slice(1)}: ${
    item.message
  } at line ${item.line} and character ${item.column}.${
    item.relatedInformation?.length
      ? ` This problem has references to ${item.relatedInformation.length} locations.`
      : ''
  }${item.source ? ` generated by ${item.source}` : ''}`;
}
watch(
  () => props.items,
  (items) => {
    const existing = new Set(expanded.value);
    for (const resource of new Set(items.map((item) => item.resource)))
      if (!seenResources.has(resource)) {
        seenResources.add(resource);
        existing.add(resourceId(resource));
      }
    const valid = new Set(
      items.flatMap((item) => [
        item.id,
        resourceId(item.resource),
        ...(item.relatedInformation || []).map((info) => info.id),
      ]),
    );
    expanded.value = [...existing].filter((id) => valid.has(id));
    selected.value = selected.value.filter((id) => valid.has(id));
    collapsedMessages.value = collapsedMessages.value.filter((id) =>
      valid.has(id),
    );
    if (focused.value && !valid.has(focused.value)) tree.focus();
  },
  { deep: true },
);
const seenResources = new Set(props.items.map((item) => item.resource));
if (!expanded.value.length) expanded.value = [...seenResources].map(resourceId);
watch([filter, severities], () => {
  if (filter.value === '') appliedFilter.value = '';
});
watch(totalHeight, () =>
  nextTick(() => {
    setScroll(scrollTop.value);
    scrollable.value?.scanDomNode();
  }),
);
let observer: ResizeObserver;
onMounted(() => {
  observer = new ResizeObserver(() => {
    width.value = root.value?.clientWidth || 720;
    const filter = root.value?.querySelector<HTMLElement>(
      '.viewpane-filter-container',
    );
    filterHeight.value = (filter?.offsetHeight || 24) + 20;
  });
  if (root.value) observer.observe(root.value);
});
onBeforeUnmount(() => observer?.disconnect());
const handle: ProblemsHandle = {
  focus: () => element.value?.focus(),
  focusFilter: () => filterElement.value?.focus(),
  reveal: (id) =>
    revealIndex(rows.value.findIndex((row) => row.node.id === id)),
  collapseAll: () => {
    expanded.value = [];
    selected.value = [];
    tree.focus(rows.value[0]?.node.id);
    element.value?.focus();
  },
  getFocus: () => focused.value,
};
defineExpose(handle);
</script>
<template>
  <div
    ref="root"
    class="vc-problems markers-panel pane-body"
    :style="{ height: `${height}px` }"
  >
    <ProblemsFilter
      ref="filterElement"
      v-model="filter"
      v-model:severities="severities"
      :width="width"
      :total="items.length"
      :filtered="count"
      @filter="appliedFilter = $event"
      @accept="handle.focus()"
    />
    <div class="markers-panel-container">
      <div v-if="!count" class="message-box-container" tabindex="0">
        <template v-if="items.length"
          ><span>No results found with provided filter criteria.</span
          ><a
            class="messageAction"
            tabindex="0"
            @click="clearFilters"
            @keydown.enter="clearFilters"
            @keydown.space.prevent="clearFilters"
            >Clear Filters</a
          ><span>.</span></template
        ><span v-else>No problems have been detected in the workspace.</span>
      </div>
      <div v-show="count" class="tree-container show-file-icons">
        <div
          ref="element"
          class="monaco-list vc-problems-tree mouse-support"
          :class="{ 'element-focused': focused }"
          tabindex="0"
          role="tree"
          aria-label="Problems View"
          aria-multiselectable="true"
          :aria-activedescendant="focused ? rowId(focused) : undefined"
          :style="{ height: `${bodyHeight}px` }"
          @keydown="keydown"
          @mousedown="
            !($event.target as HTMLElement).closest(
              '.action-label,.monaco-link',
            ) && element?.focus()
          "
        >
          <ScrollableElement
            ref="scrollable"
            v-model:scroll-top="scrollTop"
            :height="bodyHeight"
            horizontal="hidden"
            ><div
              class="monaco-list-rows"
              :style="{ height: `${totalHeight}px` }"
              @click.self="tree.blank()"
            >
              <div
                v-for="row of rendered"
                :id="rowId(row.node.id)"
                :key="row.node.id"
                :data-id="row.node.id"
                class="monaco-list-row"
                :class="{
                  focused: focused === row.node.id,
                  selected: selected.includes(row.node.id),
                }"
                :style="{
                  top: `${row.top}px`,
                  height: `${row.height}px`,
                  lineHeight: `${row.height}px`,
                }"
                role="treeitem"
                :aria-label="aria(row.node)"
                :aria-level="row.depth"
                :aria-posinset="row.position"
                :aria-setsize="row.setSize"
                :aria-selected="selected.includes(row.node.id)"
                :aria-expanded="
                  row.node.children?.length
                    ? expandedSet.has(row.node.id)
                    : undefined
                "
                @click="click(row, $event)"
                @auxclick.middle="click(row, $event)"
              >
                <div class="monaco-tl-row">
                  <div
                    class="monaco-tl-indent"
                    :style="{ width: `${(row.depth - 1) * 8}px` }"
                  >
                    <div
                      v-for="ancestor of row.ancestors"
                      :key="ancestor"
                      class="indent-guide"
                      :class="{ active: activeGuides.has(ancestor) }"
                      style="width: 8px"
                    />
                  </div>
                  <div
                    class="monaco-tl-twistie"
                    :class="{
                      codicon: row.node.children?.length,
                      'codicon-chevron-down': row.node.children?.length,
                      collapsed: !expandedSet.has(row.node.id),
                    }"
                    :style="{ paddingLeft: `${row.depth * 8}px` }"
                  />
                  <div class="monaco-tl-contents">
                    <ProblemRow
                      :node="row.node"
                      :multiline="!collapsedMessages.includes(row.node.id)"
                      @multiline="multiline(row.node.id)"
                      @link="emit('link', $event, row.node.item!)"
                      @action="emit('action', $event, row.node.item!)"
                    />
                  </div>
                </div> </div></div
          ></ScrollableElement>
        </div>
      </div>
    </div>
  </div>
</template>
<style src="../tree/upstream/list.css" />
<style src="../tree/upstream/tree.css" />
<style src="../explorer/seti.css" />
<style src="./markers.css" />
<style src="./filter.css" />
<style src="./problems.css" />
