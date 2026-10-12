<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { pauseCSSAnimationsWhenHidden } from './animationSync';

/**
 * The classic workbench pixel spinner: six 2×2px dots in a 16×16 box, driven by
 * `currentColor` (set `color` on the surrounding element) and by the upstream
 * `pixelSpinner.css`, which is copied verbatim into this folder.
 *
 * Two entry points differ from the original factory:
 *  - the spinner is declarative — `variant` and `ariaLabel` are props instead of
 *    arguments to `createPixelSpinner()`, and the returned element is exposed;
 *  - `ariaLabel` is read once at creation upstream, while here it is reactive with the
 *    same rule: a truthy label is a status name, anything falsy is decorative.
 *
 * Not ported: nothing else. The 6 dots, their order, the grid/ring class names, the
 * aria contract and the offscreen pause are the same as the pinned workbench.
 */
const props = withDefaults(defineProps<{
  /** `'grid'` (default) cascades six dots down a 2×3 grid; `'ring'` orbits a highlight around them. */
  variant?: 'grid' | 'ring';
  /**
   * Accessible label. When set, the spinner is `role="status"` with this `aria-label`
   * so screen readers announce a busy state; when omitted or an empty string it is purely
   * decorative and gets `aria-hidden="true"` instead. Exactly like the original, the test is
   * truthiness — a whitespace-only label is passed through as a (blank) status name.
   */
  ariaLabel?: string;
}>(), { variant: 'grid' });

const element = ref<HTMLElement>();

/**
 * Class toggled by the visibility tracking below, and the set of animation names the
 * workbench synchronization is scoped to (see `pixelSpinner.css`): it never disturbs
 * unrelated animations or transitions running in the same subtree.
 */
const PAUSED_CLASS = 'monaco-pixel-spinner-paused';
const SPINNER_ANIMATION_NAMES = new Set([
  'monaco-pixel-spinner-dot-cycle',
  'monaco-pixel-spinner-dot-cycle-long',
  'monaco-pixel-spinner-dot-cycle-short',
  'monaco-pixel-spinner-ring-pulse',
]);

/**
 * The observer owns the paused class; this ref mirrors it so a re-render of the root
 * element cannot disagree with the DOM. `pauseCSSAnimationsWhenHidden` adds the class
 * before the first observation, so `true` is the state the element starts in.
 */
const paused = ref(false);
let stopTracking: (() => void) | undefined;

function track(): void {
  stopTracking?.();
  const root = element.value;
  if (!root) return;
  paused.value = true;
  stopTracking = pauseCSSAnimationsWhenHidden(root, {
    pausedClass: PAUSED_CLASS,
    subtree: true,
    animationNames: SPINNER_ANIMATION_NAMES,
    onPausedChange: value => { paused.value = value; },
  });
}

onMounted(track);
onBeforeUnmount(() => {
  // The same cleanup as `IPixelSpinner.dispose()`: unobserve, drop the paused class and let the
  // helper disconnect the per-window observer and its listener once nothing is tracked anymore.
  stopTracking?.();
  stopTracking = undefined;
  paused.value = false;
});

/**
 * `ariaLabel` is read once at creation upstream; here it is reactive, but the rule is the same:
 * a truthy label means `role="status"`, anything falsy means `aria-hidden="true"`.
 */
const label = computed(() => props.ariaLabel || null);

defineExpose({ element });
</script>

<template>
  <!-- `null` bindings remove the attribute, which is what the `role`/`aria-*` contract needs;
       the casts are only there because Vue's JSX types do not model attribute removal. -->
  <span ref="element" class="monaco-pixel-spinner"
    :class="{ 'monaco-pixel-spinner-ring': variant === 'ring', 'monaco-pixel-spinner-paused': paused }"
    :role="(label ? 'status' : null) as any" :aria-label="(label as any)" :aria-hidden="(label ? null : 'true') as any">
    <span v-for="index in 6" :key="index" class="monaco-pixel-spinner-dot" />
  </span>
</template>

<style src="./pixelSpinner.css" />
