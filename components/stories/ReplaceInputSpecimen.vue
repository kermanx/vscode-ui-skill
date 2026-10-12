<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ReplaceInput from '../src/components/replace-input/ReplaceInput.vue';
import ReplaceInputComposition from './ReplaceInputComposition.vue';
import { replaceExamples, validateReplacement } from './ReplaceInputData';
defineProps<{ theme?: string }>();
const values = ref(replaceExamples.map(item => item.value)), preserves = ref(replaceExamples.map(item => !!item.preserveCase));
const inputs = ref<InstanceType<typeof ReplaceInput>[]>([]), composition = ref<InstanceType<typeof ReplaceInputComposition>>();
const state = { values: values.value, preserves: preserves.value, changes: [] as string[], options: [] as string[], inputEvents: [] as number[], optionKeys: [] as string[] };
onMounted(() => { (window as any).fixtureState = state; (window as any).fixtureReplaceInputs = inputs.value; (window as any).fixtureComposition = composition.value; (window as any).fixtureReady = true; });
function fixtureProps(example: typeof replaceExamples[number]) { const { value, preserveCase, validation, ...props } = example; return props; }
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="display:flex;flex-direction:column;gap:12px;padding:4px;box-sizing:border-box">
      <div v-for="(example, index) in replaceExamples" :key="index" :data-index="index" style="width:300px">
        <ReplaceInput ref="inputs" v-bind="fixtureProps(example)" v-model="values[index]" v-model:preserve-case="preserves[index]" :validate="example.validation ? validateReplacement : undefined"
          @change="state.changes.push(`${index}:${$event}`)" @option-change="state.options.push(`${index}:${$event}`)" @input="state.inputEvents.push(index)" @preserve-case-keydown="state.optionKeys.push(`${index}:${$event.key}`)" />
      </div>
      <ReplaceInputComposition ref="composition" />
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
