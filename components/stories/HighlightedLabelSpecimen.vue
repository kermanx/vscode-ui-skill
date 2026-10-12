<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onMounted, ref } from 'vue';
import HighlightedLabel from '../src/components/highlighted-label/HighlightedLabel.vue';
import {
  cloneInput, describeClasses, describeHighlights, describeNodes, dynamicInitial, dynamicUpdates, expectedHighlights, stepInput,
  type Highlight, type HighlightInput, type LabelSnapshot,
} from './highlightedLabelData';

defineProps<{ theme?: string }>();

/** The host element of a row: a `.monaco-list-row`, or the `.monaco-tl-contents` inside one. */
type Host = 'list' | 'pane';

/** What the component exposes through `defineExpose`, the way the fixture reads the original. */
interface LabelInstance {
  element: HTMLElement | undefined;
  highlights: readonly Highlight[];
  renderCount: number;
}

/** The label instance of a row plus everything the fixture records about it. */
interface Watcher {
  key: string;
  label: LabelInstance | undefined;
  input: HighlightInput;
  snapshots: LabelSnapshot[];
}

/** Rows are `.monaco-list-row`s; `pane` rows also sit in `.pane-body > .monaco-tl-contents`. */
const PaneBody = defineComponent({
  name: 'PaneBody',
  setup(_props, { slots }) {
    return () => h('div', { class: 'pane-body' }, [h('div', { class: 'monaco-tl-contents' }, slots.default?.())]);
  },
});

const cases: { key: string; host: Host; input: HighlightInput; focused?: boolean }[] = [
  { key: 'empty', host: 'list', input: {} },
  { key: 'plain', host: 'list', input: { text: 'No highlights' } },
  { key: 'single', host: 'list', input: { text: 'Single highlight', highlights: [{ start: 7, end: 16 }] } },
  { key: 'multi', host: 'list', input: { text: 'alpha beta gamma', highlights: [{ start: 0, end: 5 }, { start: 6, end: 10 }, { start: 11, end: 16 }] } },
  { key: 'classes', host: 'list', input: { text: 'Extra classes', highlights: [{ start: 0, end: 5, extraClasses: ['nowrap', 'label-name'] }, { start: 6, end: 13 }] } },
  { key: 'adjacent', host: 'list', input: { text: 'abcdef', highlights: [{ start: 0, end: 2 }, { start: 2, end: 4 }, { start: 4, end: 6 }] } },
  { key: 'overlap', host: 'list', input: { text: 'abcdef', highlights: [{ start: 0, end: 3 }, { start: 2, end: 5 }] } },
  { key: 'zero', host: 'list', input: { text: 'Zero length', highlights: [{ start: 0, end: 0, extraClasses: ['skipped'] }, { start: 5, end: 5 }, { start: 5, end: 11 }] } },
  // The range covers the leading `$(check)` marker, so the icon is rendered inside the highlight.
  { key: 'icons', host: 'list', input: { text: '$(check) Sync $(sync~spin) done', highlights: [{ start: 0, end: 8 }], supportIcons: true } },
  { key: 'symbol-icon', host: 'list', input: { text: '$(symbol-class) hello', supportIcons: true } },
  { key: 'html', host: 'list', input: { text: 'hel<lo & goodbye' } },
  { key: 'crlf', host: 'list', input: { text: 'a\r\nb', highlights: [{ start: 0, end: 4 }], escapeNewLines: true } },
  { key: 'crlf-range', host: 'list', input: { text: 'one\r\ntwo\r\nthree', highlights: [{ start: 0, end: 4 }, { start: 5, end: 9 }, { start: 10, end: 15 }], escapeNewLines: true } },
  { key: 'cr', host: 'list', input: { text: 'a\rb', highlights: [{ start: 0, end: 3 }], escapeNewLines: true } },
  { key: 'lf', host: 'list', input: { text: 'a\nb', highlights: [{ start: 0, end: 3 }], escapeNewLines: true } },
  { key: 'title', host: 'list', input: { text: 'Titled', highlights: [{ start: 0, end: 6 }], title: 'Managed hover title' } },
  { key: 'pane', host: 'pane', input: { text: 'Filter match', highlights: [{ start: 0, end: 6 }] } },
  { key: 'pane-focused', host: 'pane', input: { text: 'Filter match focused', highlights: [{ start: 7, end: 14 }] }, focused: true },
];

/** Static rows first, dynamic row last, in the same order the fixture builds them. */
const keys = [...cases.map(({ key }) => key), 'dynamic'];
const watchers: Record<string, Watcher> = {};
for (const { key, input } of [...cases, { key: 'dynamic', input: dynamicInitial }]) {
  watchers[key] = { key, label: undefined, input, snapshots: [] };
}

/** The label instance is only readable from a template ref callback. */
const setLabel = (watcher: Watcher) => (instance: unknown) => {
  if (instance) {
    watcher.label = instance as LabelInstance;
  }
};
const node = (watcher: Watcher) => watcher.label?.element;
/** Ranges the label actually rendered; before the first render falls back to the expected ones. */
const working = (watcher: Watcher) => watcher.label?.highlights
  ?? expectedHighlights(watcher.input.text, watcher.input.highlights ?? [], Boolean(watcher.input.escapeNewLines));

function snapshotOf(watcher: Watcher): LabelSnapshot {
  const element = node(watcher);
  return {
    set: watcher.snapshots.length + 1,
    text: element?.textContent ?? '',
    html: element?.outerHTML ?? '',
    nodes: element ? describeNodes(element) : '',
    classes: element ? describeClasses(element) : '',
    propsHighlights: describeHighlights(watcher.input.highlights ?? []),
    highlights: describeHighlights(working(watcher)),
    newNode: (watcher.label?.renderCount ?? 0) > (watcher.snapshots.at(-1)?.renderCount ?? 0),
    renderCount: watcher.label?.renderCount ?? 0,
  };
}

const state = {
  labels: [] as { key: string; text: string; nodes: string; classes: string }[],
  labelsDetail: {} as Record<string, LabelSnapshot[]>,
  propsHighlights: {} as Record<string, string>,
  workingHighlights: {} as Record<string, string>,
  expectedHighlights: {} as Record<string, string>,
  renderCounts: {} as Record<string, number>,
  titles: {} as Record<string, string | null>,
  dynamicDetail: [] as LabelSnapshot[],
};

/** Dynamic row state; every step passes a fresh array, like the fixture's `set()`. */
const dynamic = ref<HighlightInput>(cloneInput(dynamicInitial));
const dynamicHighlights = computed<Highlight[]>(() => (dynamic.value.highlights ?? []).map(highlight => ({ ...highlight })));
let previous: HighlightInput = cloneInput(dynamicInitial);

/** Applies one step to the dynamic row; both pages expose this as `applyHighlightedLabelUpdate`. */
async function set(step?: HighlightInput): Promise<{ renderCount: number; states: LabelSnapshot[]; snapshot: LabelSnapshot }> {
  const watcher = watchers.dynamic;
  let snapshot = watcher.snapshots.at(-1) ?? watcher.snapshots[0];
  if (step) {
    const input = cloneInput(stepInput(step, previous));
    previous = input;
    watcher.input = input;
    dynamic.value = input;
    await nextTick();
    snapshot = snapshotOf(watcher);
    watcher.snapshots.push(snapshot);
    state.dynamicDetail = watcher.snapshots;
    state.renderCounts.dynamic = watcher.label?.renderCount ?? 0;
  }
  return { renderCount: watcher.label?.renderCount ?? 0, states: watcher.snapshots, snapshot };
}

/** Reads every row into `state`; called after mount and after each dynamic step. */
function capture() {
  for (const key of keys) {
    const watcher = watchers[key];
    const element = node(watcher);
    if (!element) {
      continue;
    }
    if (!watcher.snapshots.length) {
      watcher.snapshots.push(snapshotOf(watcher));
    }
    state.labelsDetail[key] = watcher.snapshots;
    if (key === 'dynamic') {
      continue;
    }
    state.propsHighlights[key] = describeHighlights(watcher.input.highlights ?? []);
    state.workingHighlights[key] = describeHighlights(working(watcher));
    state.expectedHighlights[key] = describeHighlights(expectedHighlights(watcher.input.text, watcher.input.highlights ?? [], Boolean(watcher.input.escapeNewLines)));
    state.titles[key] = element.getAttribute('title');
    state.renderCounts[key] = watcher.label?.renderCount ?? 0;
    state.labels.push({ key, text: element.textContent ?? '', nodes: describeNodes(element), classes: describeClasses(element) });
  }
}

onMounted(async () => {
  await nextTick();
  // The label's own initial `set()` runs before mount; `dynamicDetail[0]` keeps that placeholder so
  // the recorded changes start at `set: 2`, exactly like the fixture's dynamic label.
  watchers.dynamic.snapshots.push(snapshotOf(watchers.dynamic));
  capture();
  state.renderCounts.dynamic = 0;
  (window as any).highlightedLabelHandle = {
    set: (step: HighlightInput) => set(step),
    renderCount: () => watchers.dynamic.label?.renderCount ?? 0,
    get element() { return watchers.dynamic.label?.element; },
    get highlights() { return watchers.dynamic.label?.highlights ?? []; },
  };
  // Same entry point the fixture exports: replays the whole timeline through the dynamic row.
  (window as any).applyHighlightedLabelUpdate = async () => {
    let result = { renderCount: 0, states: watchers.dynamic.snapshots, snapshot: snapshotOf(watchers.dynamic) };
    for (const update of dynamicUpdates) {
      result = await set(update);
    }
    return result;
  };
  // Same step list the fixture's dynamic label replays.
  (window as any).highlightedLabelSteps = dynamicUpdates;
  (window as any).fixtureState = state;
  (window as any).fixtureReady = true;
});

</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen button-specimen" data-testid="specimen">
      <!-- Same geometry the fixture gives each row: a 22px list holding one 22px row. -->
      <div v-for="item in cases" :key="item.key" class="monaco-list" style="position:relative;width:100%;height:22px;white-space:nowrap;overflow:hidden">
        <div class="monaco-list-row" :class="{ focused: item.focused }" :data-key="item.key" style="position:relative;height:22px;line-height:22px;white-space:nowrap;overflow:hidden">
          <PaneBody v-if="item.host === 'pane'">
            <HighlightedLabel :ref="setLabel(watchers[item.key])" :text="item.input.text" :highlights="item.input.highlights"
              :title="item.input.title" :escape-new-lines="item.input.escapeNewLines" :support-icons="item.input.supportIcons" />
          </PaneBody>
          <HighlightedLabel v-else :ref="setLabel(watchers[item.key])" :text="item.input.text" :highlights="item.input.highlights"
            :title="item.input.title" :escape-new-lines="item.input.escapeNewLines" :support-icons="item.input.supportIcons" />
        </div>
      </div>
      <div class="monaco-list" style="position:relative;width:100%;height:22px;white-space:nowrap;overflow:hidden">
        <div class="monaco-list-row" data-key="dynamic" style="position:relative;height:22px;line-height:22px;white-space:nowrap;overflow:hidden">
          <HighlightedLabel :ref="setLabel(watchers.dynamic)" :text="dynamic.text" :highlights="dynamicHighlights"
            :title="dynamic.title" :escape-new-lines="dynamic.escapeNewLines" :support-icons="dynamic.supportIcons" />
        </div>
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
