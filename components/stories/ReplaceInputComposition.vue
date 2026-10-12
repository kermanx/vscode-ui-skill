<script setup lang="ts">
import { reactive, ref } from 'vue';
import FindInput from '../src/components/find-input/FindInput.vue';
import ReplaceInput from '../src/components/replace-input/ReplaceInput.vue';
import Button from '../src/components/button/Button.vue';
import { compositionSample, compositionStyle } from './ReplaceInputData';
import { buildReplaceStringWithCasePreserved } from './ReplaceInputCase';
const find = ref<InstanceType<typeof FindInput>>(), replacement = ref<InstanceType<typeof ReplaceInput>>(), replaceButton = ref<InstanceType<typeof Button>>();
const root = ref<HTMLElement>();
const state = reactive({ query: 'example', replacement: 'result', matchCase: false, wholeWord: false, regex: false, preserveCase: true, text: compositionSample, replacements: 0 });
function findKeydown(event: KeyboardEvent) {
  if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'Tab') { replacement.value?.focus(); event.preventDefault(); }
}
function replaceKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Tab') { if (event.shiftKey) find.value?.focus(); else find.value?.focusCaseSensitive(); event.preventDefault(); }
}
function optionKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.key !== 'Tab') return;
  const option = (event.target as HTMLElement).dataset.option;
  if (option === 'case' && event.shiftKey) { replacement.value?.focus(); event.preventDefault(); }
  else if (option === 'regex' && !event.shiftKey) { replacement.value?.focusPreserveCase(); event.preventDefault(); }
  else if (option === 'preserve' && !event.shiftKey) { replaceButton.value?.focus(); event.preventDefault(); }
}
function applyReplace() {
  if (!state.query) return;
  try {
    const source = state.regex ? state.query : state.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const expression = new RegExp(state.wholeWord ? `\\b(?:${source})\\b` : source, state.matchCase ? 'gu' : 'giu');
    state.text = state.text.replace(expression, match => state.preserveCase ? buildReplaceStringWithCasePreserved([match], state.replacement) : state.replacement);
    state.replacements++; find.value?.submit(); replacement.value?.submit();
  } catch { /* An invalid search expression has no matches. */ }
}
defineExpose({ state, reset: () => { state.text = compositionSample; } });
</script>
<template>
  <div ref="root" data-composition :style="compositionStyle" @keydown="optionKeydown">
    <FindInput ref="find" v-model="state.query" v-model:match-case="state.matchCase" v-model:whole-word="state.wholeWord" v-model:regex="state.regex" aria-label="Search to replace" @keydown="findKeydown" />
    <ReplaceInput ref="replacement" v-model="state.replacement" v-model:preserve-case="state.preserveCase" aria-label="Replacement value" @keydown="replaceKeydown" />
    <div style="display:flex;gap:8px"><Button ref="replaceButton" label="Replace All" aria-label="Replace All" icon="replace-all" @click="applyReplace" /><Button label="Reset" secondary @click="state.text = compositionSample" /></div>
    <div data-output style="white-space:pre-wrap">{{ state.text }}</div>
  </div>
</template>
