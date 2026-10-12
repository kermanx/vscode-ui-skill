<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

/** Discrete or indeterminate progress, with declarative props and imperative controls.
 * Progress audio signals are not provided. */
interface ProgressBarApi {
  show(delay?: number): void;
  hide(): void;
  infinite(): ProgressBarApi;
  total(value: number): ProgressBarApi;
  worked(value: number): ProgressBarApi;
  setWorked(value: number): ProgressBarApi;
  done(): ProgressBarApi;
  stop(): ProgressBarApi;
  hasTotal(): boolean;
  getContainer(): HTMLElement | undefined;
}

const CSS_DONE = 'done';
const CSS_ACTIVE = 'active';
const CSS_INFINITE = 'infinite';
const CSS_INFINITE_LONG_RUNNING = 'infinite-long-running';
const CSS_DISCRETE = 'discrete';
const NLS_PROGRESS_LABEL = 'Progress';

/**
 * After a certain time of showing the progress bar, switch
 * to long-running mode and throttle animations to reduce
 * the pressure on the GPU process.
 *
 * https://github.com/microsoft/vscode/issues/97900
 * https://github.com/microsoft/vscode/issues/138396
 */
const LONG_RUNNING_INFINITE_THRESHOLD = 10000;

const props = withDefaults(defineProps<{
  /** Total number of work units; enables discrete progress and sets `aria-valuemax`. */
  total?: number;
  /** Absolute amount of work done (like `setWorked`): 0–100 without a total, otherwise clamped to it. */
  worked?: number;
  /** Indeterminate progress. Running longer than 10s switches to the throttled animation. */
  infinite?: boolean;
  /** Visibility of the container; `false` hides it immediately, `true` shows it again (`show(showDelay)`). */
  visible?: boolean;
  /** Delay in milliseconds used when the bar is shown again (`show(delay)`). */
  showDelay?: number;
  /** Accessible name; empty or whitespace-only falls back to "Progress". */
  ariaLabel?: string;
}>(), { infinite: false, visible: true });

const element = ref<HTMLElement>();
const bit = ref<HTMLElement>();

let workedVal = 0;
let totalWork: number | undefined;
// Mirrors the `display: none` state `hide()` leaves behind, so the declarative `visible`
// prop is symmetric: false hides, true shows again.
let hidden = false;
// RunOnceScheduler equivalents: at most one pending delayed show / long-running switch.
let showDelayedToken: number | undefined;
let longRunningToken: number | undefined;
// `done()` uses a plain setTimeout upstream; keep the tokens to clean them up on unmount.
const doneTokens = new Set<number>();

/** Reveal the bar and its accessibility tree entry. */
function showElement(): void {
  const container = element.value;
  if (!container) return;
  container.style.display = '';
  container.removeAttribute('aria-hidden');
  hidden = false;
}

/** Hide the bar and remove it from layout and the accessibility tree. */
function hideElement(): void {
  const container = element.value;
  if (!container) return;
  container.style.display = 'none';
  container.setAttribute('aria-hidden', 'true');
  hidden = true;
}

function off(): void {
  const container = element.value;
  if (!container || !bit.value) return;
  bit.value.style.width = 'inherit';
  bit.value.style.opacity = '1';
  container.classList.remove(CSS_ACTIVE, CSS_INFINITE, CSS_INFINITE_LONG_RUNNING, CSS_DISCRETE);

  workedVal = 0;
  totalWork = undefined;

  // this.longRunningScheduler.cancel();
  if (longRunningToken !== undefined) { clearTimeout(longRunningToken); longRunningToken = undefined; }
}

/** Indicates to the progress bar that all work is done. */
function done(): ProgressBarApi {
  return doDone(true);
}

/** Stops the progressbar from showing any progress instantly without fading out. */
function stop(): ProgressBarApi {
  return doDone(false);
}

function doDone(delayed: boolean): ProgressBarApi {
  const container = element.value;
  if (!container || !bit.value) return api;

  container.classList.add(CSS_DONE);

  // discrete: let it grow to 100% width and hide afterwards
  if (!container.classList.contains(CSS_INFINITE)) {
    bit.value.style.width = 'inherit';
  }

  // infinite: let it fade out and hide afterwards
  else {
    bit.value.style.opacity = '0';
  }

  if (delayed) {
    const token = window.setTimeout(() => { doneTokens.delete(token); off(); }, 200);
    doneTokens.add(token);
  } else {
    off();
  }

  return api;
}

/** Use this mode to indicate progress that has no total number of work units. */
function infinite(): ProgressBarApi {
  const container = element.value;
  if (!container || !bit.value) return api;

  bit.value.style.width = '2%';
  bit.value.style.opacity = '1';

  container.classList.remove(CSS_DISCRETE, CSS_DONE, CSS_INFINITE_LONG_RUNNING);
  container.classList.add(CSS_ACTIVE, CSS_INFINITE);

  // this.longRunningScheduler.schedule();
  if (longRunningToken !== undefined) clearTimeout(longRunningToken);
  longRunningToken = window.setTimeout(() => { longRunningToken = undefined; infiniteLongRunning(); }, LONG_RUNNING_INFINITE_THRESHOLD);

  return api;
}

function infiniteLongRunning(): void {
  element.value?.classList.add(CSS_INFINITE_LONG_RUNNING);
}

/**
 * Tells the progress bar the total number of work. Use in combination with `worked`/`setWorked`
 * to let the progress bar show the actual progress based on the work that is done.
 */
function total(value: number): ProgressBarApi {
  workedVal = 0;
  totalWork = value;
  element.value?.setAttribute('aria-valuemax', value.toString());

  return api;
}

/** Finds out if this progress bar is configured with total work. */
function hasTotal(): boolean {
  return typeof totalWork === 'number';
}

/** Tells the progress bar that an increment of work has been completed. */
function worked(value: number): ProgressBarApi {
  value = Math.max(1, Number(value));

  return doSetWorked(workedVal + value);
}

/** Tells the progress bar the total amount of work (0 to 100) that has been completed. */
function setWorked(value: number): ProgressBarApi {
  value = Math.max(1, Number(value));

  return doSetWorked(value);
}

function doSetWorked(value: number): ProgressBarApi {
  const container = element.value;
  if (!container || !bit.value) return api;

  const work = totalWork || 100;

  workedVal = value;
  workedVal = Math.min(work, workedVal);

  container.classList.remove(CSS_INFINITE, CSS_INFINITE_LONG_RUNNING, CSS_DONE);
  container.classList.add(CSS_ACTIVE, CSS_DISCRETE);
  container.setAttribute('aria-valuenow', value.toString());

  bit.value.style.width = 100 * (workedVal / (work)) + '%';

  return api;
}

function getContainer(): HTMLElement | undefined {
  return element.value;
}

function show(delay?: number): void {
  // this.showDelayedScheduler.cancel();
  if (showDelayedToken !== undefined) { clearTimeout(showDelayedToken); showDelayedToken = undefined; }

  if (typeof delay === 'number') {
    // RunOnceScheduler: the delayed show runs on a timer, `show()` without delay is immediate.
    showDelayedToken = window.setTimeout(() => { showDelayedToken = undefined; showElement(); }, delay);
  } else {
    showElement();
  }
}

function hide(): void {
  hideElement();

  // this.showDelayedScheduler.cancel();
  if (showDelayedToken !== undefined) { clearTimeout(showDelayedToken); showDelayedToken = undefined; }
}

const api: ProgressBarApi = { show, hide, infinite, total, worked, setWorked, done, stop, hasTotal, getContainer };

/** Apply work, mode and visibility in that order. */
function applyProps(): void {
  if (props.total !== undefined) total(props.total);
  if (props.worked !== undefined) setWorked(props.worked);
  if (props.infinite) infinite();
  if (!props.visible) hide();
  else if (props.showDelay !== undefined || hidden) show(props.showDelay);
}

onMounted(applyProps);

watch(() => [props.total, props.worked, props.infinite, props.visible, props.showDelay] as const,
  ([, , isInfinite], [, , wasInfinite]) => {
    // Ending indeterminate progress without a known total or amount of work is `stop()`.
    if (wasInfinite && !isInfinite && props.total === undefined && props.worked === undefined) { stop(); }
    applyProps();
  });

onBeforeUnmount(() => {
  // The two schedulers are disposables upstream, but the 200ms `done()` timer is not tracked;
  // cancel everything here so no callback outlives the component (the nodes are gone anyway).
  if (showDelayedToken !== undefined) clearTimeout(showDelayedToken);
  if (longRunningToken !== undefined) clearTimeout(longRunningToken);
  for (const token of doneTokens) clearTimeout(token);
  showDelayedToken = longRunningToken = undefined;
  doneTokens.clear();
});

defineExpose(api);
</script>

<template>
  <div ref="element" class="monaco-progress-container" role="progressbar" aria-valuemin="0"
    :aria-label="ariaLabel && ariaLabel.trim() ? ariaLabel : NLS_PROGRESS_LABEL">
    <div ref="bit" class="progress-bit" :style="{ backgroundColor: 'var(--vscode-progressBar-background, #0E70C0)' }" />
  </div>
</template>

<style src="./progressbar.css" />
