<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import ProgressBar from '../src/components/progress-bar/ProgressBar.vue';
import {
  applyProgressSteps, progressBarExamples, progressHeaderStyle, progressOverlayStyle, progressRowStyle,
  progressSurfaceStyle, snapshotProgressBars, type ProgressBarApi, type ProgressBarProps, type ProgressBarStep,
} from './ProgressBarData';

defineProps<{ theme?: string }>();

const mounted = ref(true);
const rows = progressBarExamples.map(example => ({ example, props: reactive<ProgressBarProps>({ ...example.props }) }));
// Function refs with stable identities: the rows can unmount and mount again.
const barRefs: (ProgressBarApi | null)[] = [];
const refSetters = progressBarExamples.map((_, index) => (bar: unknown) => { barRefs[index] = bar as ProgressBarApi | null; });
const calls: string[] = [];
const state = { calls, bars: [] as unknown[] };
(window as any).fixtureState = state;

const bars = () => barRefs.filter((bar): bar is ProgressBarApi => !!bar);

function snapshot() {
  state.bars = snapshotProgressBars(bars());
  return { bars: state.bars, calls };
}

(window as any).fixtureBars = barRefs;
(window as any).fixtureSnapshot = snapshot;
/** Declarative update: mutating the props is what a consumer does, the component reacts to it. */
(window as any).fixtureSet = async (index: number, patch: ProgressBarProps) => {
  Object.assign(rows[index].props, patch);
  await nextTick();
};
(window as any).fixtureRun = (index: number, steps: ProgressBarStep[]) => {
  const bar = barRefs[index];
  if (bar) applyProgressSteps(bar, steps, calls);
};
(window as any).fixtureUnmount = () => { mounted.value = false; };
(window as any).fixtureMount = () => { mounted.value = true; };

onMounted(async () => {
  await nextTick();
  applyCommands();
  snapshot();
  (window as any).fixtureReady = true;
});

// The rows can unmount and mount again; the recorded commands are part of the canvas state,
// so a remounted canvas looks exactly like the initial one.
watch(mounted, async value => {
  if (!value) return;
  await nextTick();
  applyCommands();
  snapshot();
});

/**
 * Mount-time commands are recorded in `calls`; the declarative props are applied by the
 * component itself, so both pages run the same sequence and log the same commands.
 */
function applyCommands() {
  progressBarExamples.forEach((example, index) => {
    const bar = barRefs[index];
    if (bar && example.steps?.length) applyProgressSteps(bar, example.steps, calls);
  });
}
</script>

<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" :style="progressSurfaceStyle">
      <template v-if="mounted">
        <div v-for="(row, index) in rows" :key="row.example.id" :data-index="index" :data-id="row.example.id"
          :style="progressRowStyle(row.example.presentation)">
          <div :style="progressHeaderStyle(row.example.presentation)">{{ row.example.title }}</div>
          <ProgressBar :ref="refSetters[index]" v-bind="row.props" :aria-label="row.example.label"
            :style="progressOverlayStyle(row.example.presentation)" />
        </div>
      </template>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
