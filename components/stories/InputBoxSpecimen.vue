<script setup lang="ts">
import { onMounted, ref } from 'vue';
import InputBox from '../src/components/input-box/InputBox.vue';
import { inputBoxExamples, validateEmail } from './InputBoxData';
defineProps<{ theme?: string }>();
const values = ref(inputBoxExamples.map(item => item.value));
const inputs = ref<InstanceType<typeof InputBox>[]>([]);
const state = { values: values.value, changes: [] as string[], actions: [] as string[] };
onMounted(() => { (window as any).fixtureState = state; (window as any).fixtureInputs = inputs.value; (window as any).fixtureReady = true; });
function fixtureProps(example: typeof inputBoxExamples[number]) { const { value, validation, ...props } = example; return props; }
function action(index: number, id: string) { state.actions.push(`${index}:${id}`); if (id === 'clear' && values.value[index]) { values.value[index] = ''; } }
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="display:flex;flex-direction:column;gap:16px;padding:4px;box-sizing:border-box">
      <div v-for="(example, index) in inputBoxExamples" :key="index" :data-index="index" style="width:280px">
        <InputBox ref="inputs" v-bind="fixtureProps(example)" v-model="values[index]" :validate="example.validation ? validateEmail : undefined"
          @change="state.changes.push(`${index}:${$event}`)" @action="action(index, $event.id)" />
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
