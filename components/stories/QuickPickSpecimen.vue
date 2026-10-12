<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import QuickPick from '../src/components/quick-input/QuickPick.vue';
import { quickPickExamples, quickPickProps } from './QuickPickData';
import type {
  QuickPickAcceptEvent,
  QuickPickProps,
} from '../src/components/quick-input/quickPickTypes';
import type { QuickInputHideReason } from '../src/components/quick-input/types';
defineProps<{ theme?: string }>();
const selected = ref(0);
const open = ref(false);
const value = ref('');
const activeIds = ref<string[]>([]);
const selectedIds = ref<string[]>([]);
const input = ref<InstanceType<typeof QuickPick>>();
const overrides = ref<Partial<QuickPickProps>>({});
const state = {
  accepts: [] as any[],
  hides: [] as any[],
  buttons: [] as string[],
  changes: [] as string[],
  active: [] as string[][],
  selection: [] as string[][],
  itemButtons: [] as any[],
  separatorButtons: [] as any[],
  links: [] as string[],
};
async function show(index: number) {
  if (open.value) {
    open.value = false;
    await nextTick();
    await nextTick();
  }
  selected.value = index;
  overrides.value = {};
  value.value = quickPickExamples[index].value || '';
  activeIds.value = quickPickExamples[index].activeIds?.slice() || [];
  selectedIds.value = quickPickExamples[index].selectedIds?.slice() || [];
  await nextTick();
  document.querySelector<HTMLButtonElement>(`[data-open="${index}"]`)?.focus();
  open.value = true;
  await nextTick();
  await nextTick();
  await nextTick();
}
function accept(event: QuickPickAcceptEvent) {
  state.accepts.push({ index: selected.value, ...event });
  if (!quickPickExamples[selected.value].keepOpenOnAccept) open.value = false;
}
function hide(reason: QuickInputHideReason) {
  state.hides.push({ index: selected.value, reason });
}
onMounted(async () => {
  (window as any).fixtureState = state;
  (window as any).fixtureOpenQuickPick = show;
  (window as any).fixtureQuickPick = input.value;
  (window as any).fixtureUpdateQuickPick = (props: any) => {
    const {
      value: nextValue,
      activeIds: active,
      selectedIds: selected,
      ...rest
    } = props;
    overrides.value = { ...overrides.value, ...rest };
    if (nextValue !== undefined) value.value = nextValue;
    if (active) activeIds.value = active;
    if (selected) selectedIds.value = selected;
  };
  await show(Number(new URLSearchParams(location.search).get('case') || 0));
  (window as any).fixtureReady = true;
});
</script>
<template>
  <div
    class="vc-theme fixture-root"
    :data-theme="theme || 'dark'"
    style="position: relative"
  >
    <div
      class="specimen"
      data-testid="specimen"
      style="
        display: grid;
        grid-template-columns: repeat(2, 230px);
        gap: 8px;
        padding: 4px;
        box-sizing: border-box;
      "
    >
      <button
        v-for="(example, index) in quickPickExamples"
        :key="index"
        class="outside"
        :data-open="index"
        style="margin: 0; text-align: left"
        @click="show(index)"
      >
        {{ example.name }}
      </button>
    </div>
    <button class="outside">Move focus outside</button>
    <QuickPick
      ref="input"
      v-model:open="open"
      v-model:value="value"
      v-model:active-ids="activeIds"
      v-model:selected-ids="selectedIds"
      v-bind="{ ...quickPickProps(quickPickExamples[selected]), ...overrides }"
      @accept="accept"
      @will-accept="quickPickExamples[selected].vetoAccept && $event.veto()"
      @hide="hide"
      @change="state.changes.push($event)"
      @active-change="state.active.push($event)"
      @selection-change="state.selection.push($event)"
      @button="state.buttons.push($event)"
      @link="state.links.push($event)"
      @item-button="state.itemButtons.push($event)"
      @separator-button="state.separatorButtons.push($event)"
    />
  </div>
</template>
