<script setup lang="ts">
import { onMounted, ref } from 'vue';
import FindInput from '../src/components/find-input/FindInput.vue';
import { findExamples, validateFind } from './FindInputData';
defineProps<{ theme?: string }>();
const values = ref(findExamples.map(item => item.value));
const cases = ref(findExamples.map(item => !!item.matchCase)), words = ref(findExamples.map(() => false)), regexes = ref(findExamples.map(item => !!item.regex));
const activeOptions = ref(findExamples.map(item => item.activeOptions ?? []));
words.value = findExamples.map(item => !!item.wholeWord);
const inputs = ref<InstanceType<typeof FindInput>[]>([]);
const state = { values: values.value, cases: cases.value, words: words.value, regexes: regexes.value, activeOptions: activeOptions.value, changes: [] as string[], options: [] as string[], inputEvents: [] as string[] };
onMounted(() => { (window as any).fixtureState = state; (window as any).fixtureFindInputs = inputs.value; (window as any).fixtureReady = true; });
function fixtureProps(example: typeof findExamples[number]) { const { value, matchCase, wholeWord, regex, activeOptions, validation, ...props } = example; return props; }
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="display:flex;flex-direction:column;gap:12px;padding:4px;box-sizing:border-box">
      <div v-for="(example, index) in findExamples" :key="index" :data-index="index" style="width:300px">
        <FindInput ref="inputs" v-bind="fixtureProps(example)" v-model="values[index]" v-model:match-case="cases[index]" v-model:whole-word="words[index]" v-model:regex="regexes[index]" v-model:active-options="activeOptions[index]"
          :validate="example.validation ? validateFind : undefined" @change="state.changes.push(`${index}:${$event}`)" @option-change="state.options.push(`${index}:${$event}`)" @input="state.inputEvents.push(`${index}:${$event.fromCompositionEnd}`)" />
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
