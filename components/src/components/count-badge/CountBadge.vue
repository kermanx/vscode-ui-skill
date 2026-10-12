<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue';
import DelayedTooltip from '../tooltip/DelayedTooltip.vue';
import { format } from './format';
import type { CountBadgeVariant } from './types';
export type { CountBadgeVariant } from './types';

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const props = withDefaults(
  defineProps<{
    /** Number the badge counts. */
    count?: number;
    /** Badge text; `{0}` is replaced by `count`, like the original's `countFormat`. */
    countFormat?: string;
    /** Hover text; `{0}` is replaced by `count`. Empty means the badge has no hover at all. */
    titleFormat?: string;
    /** `count` for the round counter badge, `text` for the squared-off text badge (the original's `.long`). */
    variant?: CountBadgeVariant;
  }>(),
  { count: 0, countFormat: '{0}', titleFormat: '', variant: 'count' },
);

// Empty initial formats use the default; a later explicit empty format clears the badge.
const countFormat = ref(props.countFormat || '{0}');
watch(
  () => props.countFormat,
  (value) => {
    countFormat.value = value;
  },
);
const text = computed(() => format(countFormat.value, props.count));
const element = ref<HTMLElement>();
const hoverContent = computed(() =>
  props.titleFormat === '' ? null : format(props.titleFormat, props.count),
);

defineExpose({ hoverContent });
// Inline colours below are the `defaultCountBadgeStyles` ones. The long form of the badge is
// added by the caller in the original, so the replica exposes it as the `text` variant.
</script>
<template>
  <div
    v-bind="attrs"
    ref="element"
    class="monaco-count-badge"
    :class="{ long: variant === 'text' }"
    :style="{
      backgroundColor: 'var(--vscode-badge-background)',
      color: 'var(--vscode-badge-foreground)',
      border: '1px solid var(--vscode-contrastBorder)',
    }"
    >{{ text }}</div
  >
  <DelayedTooltip
    v-for="hoverText in hoverContent === null ? [] : [hoverContent]"
    key="hover"
    :target="element"
    :text="hoverText"
    placement="mouse"
  />
</template>
<style src="./countBadge.css" />
