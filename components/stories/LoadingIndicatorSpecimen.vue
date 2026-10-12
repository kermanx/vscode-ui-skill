<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import LoadingIndicator from '../src/components/loading-indicator/LoadingIndicator.vue';
import {
  loadingIndicatorExamples, loadingIndicatorSnapshot, loadingSurfaceStyle, scrollRegionStyle, scrollSpacerStyle,
  spinnerCaptionStyle, spinnerCellStyle, type LoadingIndicatorProps,
} from './LoadingIndicatorData';

defineProps<{ theme?: string }>();

const mounted = ref(true);
const scrollTop = ref(0);
const rows = loadingIndicatorExamples.map(example => ({ example, props: reactive<LoadingIndicatorProps>({ ...example.props }) }));
// Function refs with stable identities: the rows can unmount and mount again.
const spinnerRefs: ({ element?: HTMLElement } | null)[] = [];
const refSetters = loadingIndicatorExamples.map((_, index) => (spinner: unknown) => { spinnerRefs[index] = spinner as { element?: HTMLElement } | null; });
const scrollRef = ref<{ element?: HTMLElement } | null>(null);
const state: { spinners: unknown[]; scrollSpinner?: unknown } = { spinners: [] };
(window as any).fixtureState = state;

const roots = () => spinnerRefs.map(ref => ref?.element).filter((element): element is HTMLElement => !!element);

function snapshot() {
  state.spinners = loadingIndicatorSnapshot(roots());
  state.scrollSpinner = scrollRef.value?.element ? loadingIndicatorSnapshot([scrollRef.value.element])[0] : undefined;
  return state.spinners;
}

function setScroll(top: number) {
  scrollTop.value = top;
  const region = document.querySelector<HTMLElement>('[data-testid="scroll-region"]');
  if (region) region.scrollTop = top;
}

(window as any).fixtureSpinners = spinnerRefs;
(window as any).fixtureSnapshot = snapshot;
/** Declarative update: mutating the props is what a consumer does, the component reacts to it. */
(window as any).fixtureSet = async (index: number, patch: LoadingIndicatorProps) => {
  Object.assign(rows[index].props, patch);
  await nextTick();
};
(window as any).fixtureSetScroll = setScroll;
(window as any).fixtureUnmount = () => { mounted.value = false; };
(window as any).fixtureMount = () => { mounted.value = true; };

onMounted(async () => {
  await nextTick();
  snapshot();
  (window as any).fixtureReady = true;
});

// The rows can unmount and mount again; the canvas state is the declarative props, so a
// remounted canvas looks exactly like the initial one.
watch(mounted, async value => {
  if (!value) return;
  await nextTick();
  snapshot();
});
</script>

<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" :style="loadingSurfaceStyle">
      <template v-if="mounted">
        <div v-for="(row, index) in rows" :key="row.example.id" :data-index="index" :data-id="row.example.id"
          :style="spinnerCellStyle(row.example)">
          <template v-if="row.example.presentation === 'lead'">
            <LoadingIndicator :ref="refSetters[index]" variant="grid" aria-label="" />
            <span class="monaco-button-label">Installing</span>
          </template>
          <template v-else>
            <span :style="spinnerCaptionStyle">{{ row.example.title }}</span>
            <LoadingIndicator :ref="refSetters[index]" :variant="row.props.variant" :aria-label="row.props.ariaLabel" />
          </template>
        </div>
      </template>
    </div>
    <!-- Offscreen-pause canvas: the spinner sits below the visible area of a clipping
         container, so it can be scrolled out of and back into view without scrolling the
         page itself (the specimen screenshot above stays untouched). -->
    <div v-if="mounted" data-testid="scroll-region" :style="scrollRegionStyle">
      <div :style="scrollSpacerStyle">
        <div style="height:16px;display:flex;align-items:center;padding-left:8px" data-id="scroll-spinner">
          <LoadingIndicator ref="scrollRef" variant="grid" aria-label="Loading scrolled content" />
        </div>
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
