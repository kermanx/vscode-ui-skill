<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import HighlightedLabel from "../highlighted-label/HighlightedLabel.vue";
import IconLabel from "../icon-label/IconLabel.vue";
import { fileIconClasses } from "../explorer/explorerModel";
import CountBadge from "../count-badge/CountBadge.vue";
import ActionBar from "../action-bar/ActionBar.vue";
import ContextMenu from "../context-menu/ContextMenu.vue";
import DelayedTooltip from "../tooltip/DelayedTooltip.vue";
import type { ProblemNode } from "./model";
import { basename, lines } from "./model";
const props = defineProps<{ node: ProblemNode; multiline: boolean }>();
const emit = defineEmits<{
  multiline: [];
  link: [href: string];
  action: [id: string];
}>();
const resourceLabel = ref<{ element?: HTMLElement }>(),
  codeLink = ref<HTMLAnchorElement[]>(),
  multilineElement = ref<HTMLElement[]>();
watch(
  () => props.multiline,
  () =>
    nextTick(() =>
      multilineElement.value?.[0]
        ?.querySelector(".action-item")
        ?.setAttribute("aria-expanded", String(props.multiline))
    ),
  { immediate: true }
);
const message = ref<HTMLElement>(),
  fixes = ref<InstanceType<typeof ContextMenu>>();
const messageLines = computed(() =>
  props.node.item
    ? lines(props.node.item.message).slice(0, props.multiline ? undefined : 1)
    : []
);
const quickFixActions = computed(() => [
  {
    id: "fix",
    label: "Show fixes",
    icon: "light-bulb",
    disabled: !props.node.item?.quickFixes?.length,
  },
]);
const multilineActions = computed(() => [
  {
    id: "multiline",
    label: props.multiline
      ? "Show message in single line"
      : "Show message in multiple lines",
    icon: props.multiline ? "chevron-up" : "chevron-down",
    disabled: lines(props.node.item?.message || "").length < 2,
  },
]);
function showFix(_id: string, event: Event) {
  const target = (event.target as HTMLElement).closest(".action-item")!;
  const rect = target.getBoundingClientRect();
  fixes.value?.show({ x: rect.left + 10, y: rect.top + rect.height + 4 });
}
</script>
<template>
  <template v-if="node.kind === 'resource'">
    <div class="resource-label-container">
      <IconLabel
        ref="resourceLabel"
        :label="node.label"
        :description="node.resource.slice(0, node.resource.lastIndexOf('/'))"
        :title="node.resource"
        support-highlights
        :matches="node.matches"
        :extra-classes="fileIconClasses(node.resource, 'file')"
      />
    </div>
    <DelayedTooltip
      :target="resourceLabel?.element"
      :text="node.resource"
      placement="mouse"
    />
    <div class="count-badge-wrapper">
      <CountBadge :count="node.children?.length" />
    </div>
  </template>
  <template v-else-if="node.kind === 'marker' && node.item">
    <div class="actions">
      <ActionBar :actions="quickFixActions" @action="showFix" />
    </div>
    <div
      class="marker-icon"
      :class="[node.item.severity, { quickFix: node.item.quickFixes?.length }]"
    >
      <div class="codicon" :class="`codicon-${node.item.severity}`" />
    </div>
    <div ref="message" class="marker-message-details-container">
      <div
        v-for="(line, index) of messageLines"
        :key="index"
        class="marker-message-line"
        :class="{ 'details-container': index === 0 }"
        :style="line === '' ? { height: '22px' } : undefined"
      >
        <div class="marker-message">
          <HighlightedLabel
            :text="line.length > 1000 ? line.slice(0, 1000) + '...' : line"
            :highlights="node.lineMatches?.[index]"
          />
        </div>
        <template v-if="index === 0">
          <template v-if="node.item.source || node.item.code">
            <div class="marker-source">
              <HighlightedLabel
                :text="node.item.source || ''"
                :highlights="node.sourceMatches"
              />
            </div>
            <div v-if="typeof node.item.code === 'string'" class="marker-code">
              <HighlightedLabel
                :text="node.item.code"
                :highlights="node.codeMatches"
              />
            </div>
            <a
              v-else-if="node.item.code"
              ref="codeLink"
              class="monaco-link"
              role="button"
              aria-disabled="false"
              :href="node.item.code.target"
              tabindex="0"
              @click.stop.prevent="emit('link', node.item.code.target)"
              @keydown.enter.stop.prevent="emit('link', node.item.code.target)"
              @keydown.space.stop.prevent="emit('link', node.item.code.target)"
              ><div class="marker-code">
                <HighlightedLabel
                  :text="node.item.code.value"
                  :highlights="node.codeMatches"
                /></div
            ></a>
          </template>
          <span class="marker-line"
            >[Ln {{ node.item.line }}, Col {{ node.item.column }}]</span
          >
          <div ref="multilineElement" class="multiline-actions">
            <ActionBar
              :actions="multilineActions"
              @action="emit('multiline')"
            />
          </div>
        </template>
      </div>
    </div>
    <DelayedTooltip
      v-if="typeof node.item.code === 'object'"
      :target="codeLink?.[0]"
      :text="node.item.code.target"
      placement="mouse"
    />
    <DelayedTooltip
      :target="message"
      :text="node.item.message"
      placement="mouse"
    />
    <ContextMenu
      ref="fixes"
      :actions="node.item.quickFixes || []"
      @action="emit('action', $event)"
    />
  </template>
  <template v-else-if="node.related">
    <div class="actions" />
    <div class="icon" />
    <span class="related-info-resource"
      ><HighlightedLabel
        :text="basename(node.related.resource)"
        :highlights="node.matches"
        :title="node.related.resource"
    /></span>
    <span class="marker-line"
      >[Ln {{ node.related.line }}, Col {{ node.related.column }}]</span
    ><span class="related-info-resource-separator" style="padding-right: 4px"
      >:</span
    >
    <span class="marker-description"
      ><HighlightedLabel
        :text="node.related.message"
        :highlights="node.messageMatches"
        :title="node.related.message"
    /></span>
  </template>
</template>
