<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import QuickInput from '../src/components/quick-input/QuickInput.vue';
import { quickInputExamples, quickInputProps } from './QuickInputData';
import type {
  QuickInputHideReason,
  QuickInputProps,
} from '../src/components/quick-input/types';
defineProps<{ theme?: string }>();
const selected = ref(0);
const open = ref(false);
const value = ref('');
const input = ref<InstanceType<typeof QuickInput>>();
const overrides = ref<Partial<QuickInputProps>>({});
const state = {
  accepts: [] as { index: number; value: string }[],
  hides: [] as { index: number; reason: QuickInputHideReason }[],
  buttons: [] as string[],
  changes: [] as string[],
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
  value.value = quickInputExamples[index].value || '';
  await nextTick();
  document.querySelector<HTMLButtonElement>(`[data-open="${index}"]`)?.focus();
  open.value = true;
  await nextTick();
  await nextTick();
}
function accept(text: string) {
  state.accepts.push({ index: selected.value, value: text });
  if (!quickInputExamples[selected.value].keepOpenOnAccept) open.value = false;
}
function hide(reason: QuickInputHideReason) {
  state.hides.push({ index: selected.value, reason });
}
onMounted(async () => {
  (window as any).fixtureState = state;
  (window as any).fixtureOpenQuickInput = show;
  (window as any).fixtureQuickInput = input.value;
  (window as any).fixtureUpdateQuickInput = (props: any) => {
    const { value: nextValue, ...rest } = props;
    overrides.value = { ...overrides.value, ...rest };
    if (nextValue !== undefined) value.value = nextValue;
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
        v-for="(example, index) in quickInputExamples"
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
    <QuickInput
      ref="input"
      v-model:open="open"
      v-model:value="value"
      v-bind="{
        ...quickInputProps(quickInputExamples[selected]),
        ...overrides,
      }"
      @accept="accept"
      @hide="hide"
      @change="state.changes.push($event)"
      @button="state.buttons.push($event)"
      @link="state.links.push($event)"
    />
  </div>
</template>
