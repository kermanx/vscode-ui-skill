<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onMounted, reactive, ref, type Ref, type VNode } from 'vue';
// The tree row context of the pinned `views.css` (`.customview-tree .custom-view-tree-node-item…`),
// from the copy the tree component ships: the original page gets the same rules from the clone.
import '../src/components/tree/upstream/views.css';
import IconLabel from '../src/components/icon-label/IconLabel.vue';
import {
  cloneInput, describeIconLabel, disposeRow, drivenRows, listStyle, probeRow, rowStyle, rows, stepInput, stepLists, surfaceClass,
  type IconLabelDisposeResult, type IconLabelInput, type IconLabelRow, type IconLabelSnapshot, type IconLabelStep,
} from './iconLabelData';

defineProps<{ theme?: string }>();

/** What the component exposes through `defineExpose`. */
interface LabelInstance {
  element: HTMLElement | undefined;
}

/**
 * One row's ancestor chain, built with a render function: `v-if`/`v-for` in a template would wrap
 * the label in a fragment, and a fragment inserts its own anchor nodes next to it.
 */
const RowHost = defineComponent({
  name: 'IconLabelRowHost',
  props: {
    host: { type: String, required: true },
    rowKey: { type: String, required: true },
    focused: { type: Boolean, default: false },
    selected: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => {
      const children = slots.default?.() ?? [];
      const inner = props.host === 'tree'
        ? h('div', { class: 'custom-view-tree-node-item' }, children)
        : props.host === 'pane'
          ? h('div', { class: 'pane-body' }, [h('div', { class: 'monaco-tl-contents' }, children)])
          : children;
      return h('div', { class: 'monaco-list', style: listStyle }, [h('div', {
        class: ['monaco-list-row', props.focused ? 'focused' : undefined, props.selected ? 'selected' : undefined],
        'data-key': props.rowKey,
        style: rowStyle,
      }, inner as VNode[])]);
    };
  },
});

/** `IIconLabelValueOptions` as component props: the only translation the replica needs. */
function propsOf(input: IconLabelInput, creation?: IconLabelRow['creation']) {
  return {
    label: input.label,
    description: input.description,
    suffix: input.suffix,
    matches: input.matches,
    descriptionMatches: input.descriptionMatches,
    labelEscapeNewLines: input.labelEscapeNewLines,
    bold: input.bold,
    italic: input.italic,
    strikethrough: input.strikethrough,
    disabledCommand: input.disabledCommand,
    extraClasses: input.extraClasses,
    // `{ id }` is the ThemeIcon branch, `{ uri }` the background-image branch of the original.
    iconPath: input.iconPath
      ? input.iconPath.kind === 'theme' ? { id: input.iconPath.id } : { uri: input.iconPath.uri }
      : undefined,
    hideIcon: input.hideIcon,
    separator: input.separator,
    domId: input.domId,
    // A string title is the accessible name; `{ value }` is the markdown tooltip branch.
    title: input.title
      ? input.title.kind === 'text' ? input.title.value : { value: input.title.value }
      : undefined,
    supportHighlights: creation?.supportHighlights ?? false,
    supportIcons: creation?.supportIcons ?? false,
    supportDescriptionHighlights: creation?.supportDescriptionHighlights ?? false,
  };
}

/** The label instance is only readable from a template ref callback. */
const instances = new Map<string, LabelInstance>();
const setLabelRef = (key: string) => (instance: unknown) => {
  if (instance) {
    instances.set(key, instance as LabelInstance);
  }
};
const elementOf = (key: string): HTMLElement | undefined => instances.get(key)?.element;
const nameFirstChild = (element: HTMLElement | undefined): Node | null => element?.querySelector('.monaco-icon-name-container')?.firstChild ?? null;

/** One reactive input per driven row, and the props they feed the component with. */
const drivenInputs: Record<string, Ref<IconLabelInput>> = Object.fromEntries(
  drivenRows.map(({ row }) => [row.key, ref<IconLabelInput>(cloneInput(row.input))]));
// `reactive` unwraps the computeds, so the template binds a plain props object per row.
const drivenProps = reactive(Object.fromEntries(
  drivenRows.map(({ row }) => [row.key, computed(() => propsOf(drivenInputs[row.key]!.value, row.creation))]))) as unknown as Record<string, ReturnType<typeof propsOf>>;
const disposeProps = propsOf(disposeRow.input);
const probeMounted = ref(true);
const probeProps = propsOf(probeRow.input);

const state = {
  labels: [] as IconLabelSnapshot[],
  steps: {} as Record<string, IconLabelStep[]>,
  dispose: undefined as IconLabelDisposeResult | undefined,
};
for (const { row } of drivenRows) {
  state.steps[row.key] = [];
}

/** Applies one step to a driven row; both pages publish this as `iconLabelFixture.set`. */
async function set(step: Partial<IconLabelInput>, row: string): Promise<IconLabelStep> {
  const input = drivenInputs[row]!;
  const previous = nameFirstChild(elementOf(row));
  input.value = stepInput(step, input.value);
  await nextTick();
  const element = elementOf(row)!;
  const result: IconLabelStep = {
    snapshot: describeIconLabel(row, element),
    newNode: nameFirstChild(element) !== previous,
  };
  state.steps[row]!.push(result);
  return result;
}

/**
 * `dispose()` of the original releases its managed hovers and leaves the DOM alone. The replica has
 * no hover service to release, so it reports the untouched DOM and `null` for the hover bookkeeping.
 */
async function dispose(): Promise<IconLabelDisposeResult> {
  await nextTick();
  const before = describeIconLabel(disposeRow.key, elementOf(disposeRow.key) ?? null);
  const after = describeIconLabel(disposeRow.key, elementOf(disposeRow.key) ?? null);
  return { before, after, changed: before.html !== after.html, hoverBefore: null, hoverAfter: null };
}

/** Replica-only probe: mounting and unmounting leaves the same DOM and no listeners behind. */
async function probe(mounted: boolean): Promise<IconLabelSnapshot | null> {
  probeMounted.value = mounted;
  await nextTick();
  return mounted ? describeIconLabel(probeRow.key, elementOf(probeRow.key) ?? null) : null;
}

onMounted(async () => {
  await nextTick();
  for (const row of [...rows, ...drivenRows.map(({ row }) => row), disposeRow]) {
    state.labels.push(describeIconLabel(row.key, elementOf(row.key) ?? null));
  }
  state.dispose = await dispose();
  (window as any).iconLabelFixture = {
    set: (step: Partial<IconLabelInput>, row: string) => set(step, row),
    dispose: () => dispose(),
    snapshot: (key: string) => describeIconLabel(key, elementOf(key) ?? null),
    probe: (mounted: boolean) => probe(mounted),
  };
  // Same step lists the fixture's driven labels replay.
  (window as any).iconLabelSteps = stepLists;
  (window as any).fixtureState = state;
  (window as any).fixtureReady = true;
});
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div :class="surfaceClass" data-testid="specimen">
      <!-- One list row per label, in the same order the fixture builds them. -->
      <RowHost v-for="row in rows" :key="row.key" :host="row.host" :row-key="row.key"
        :focused="row.focused" :selected="row.selected">
        <IconLabel :ref="setLabelRef(row.key)" v-bind="propsOf(row.input, row.creation)" />
      </RowHost>
      <RowHost v-for="driven in drivenRows" :key="driven.row.key" :host="driven.row.host" :row-key="driven.row.key">
        <IconLabel :ref="setLabelRef(driven.row.key)" v-bind="drivenProps[driven.row.key]" />
      </RowHost>
      <RowHost :host="disposeRow.host" :row-key="disposeRow.key">
        <IconLabel :ref="setLabelRef(disposeRow.key)" v-bind="disposeProps" />
      </RowHost>
    </div>
    <!-- Outside the compared canvas: the mount/unmount probe of the replica's lifecycle. -->
    <div style="display:none" data-testid="probe">
      <RowHost v-if="probeMounted" :host="probeRow.host" :row-key="probeRow.key">
        <IconLabel :ref="setLabelRef(probeRow.key)" v-bind="probeProps" />
      </RowHost>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
