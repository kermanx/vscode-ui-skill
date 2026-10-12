<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed } from 'vue';
import { codiconClassNames, getCodiconAriaLabel } from './icons';
const props = withDefaults(
  defineProps<{
    /** Codicon id, such as `sync`. A `~modifier` suffix is accepted the way ThemeIcon ids carry one. */
    name: string;
    /** Adds `codicon-modifier-spin`. `loading` spins on its own and does not need it. */
    spin?: boolean;
    /** Adds the `codicon-modifier-disabled` visual modifier (opacity .4). */
    disabled?: boolean;
    /** Accessible name. `$(iconId)` markers are stripped the way the workbench labels an icon. */
    label?: string;
    /** Tooltip. */
    title?: string;
  }>(),
  { spin: false, disabled: false },
);
const classes = computed(() =>
  codiconClassNames(props.name, { spin: props.spin, disabled: props.disabled }),
);
const ariaLabel = computed(() => getCodiconAriaLabel(props.label));
</script>
<template>
  <span
    :class="classes"
    :role="label ? 'img' : undefined"
    :aria-label="label ? ariaLabel : undefined"
    :aria-hidden="label ? undefined : 'true'"
    :title="title || undefined"
  />
</template>
<style src="./codicon.css" />
<!-- Loaded after codicon.css, the order the workbench uses: the base font rules first, the
     symbol icon contribution (symbolIcon.* colours for `codicon-colored`) on top. -->
<style src="./symbolIcons.css" />
