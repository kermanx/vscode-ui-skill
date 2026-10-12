<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Checkbox from '../src/components/checkbox/Checkbox.vue';
defineProps<{ theme?: string }>();
const values = ref([false, true, false, true, false, true, false, true]);
const changes = ref<{ index: number; checked: boolean; viaKeyboard: boolean }[]>([]);
const bubbled = ref(0);
watch([values, changes, bubbled], () => { (window as any).fixtureState = { values: values.value, changes: changes.value, bubbled: bubbled.value }; }, { deep: true, immediate: true });
onMounted(() => { (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <form class="specimen button-specimen" data-testid="specimen" aria-label="Editor preferences" @submit.prevent @click="bubbled++">
      <div v-for="(name, index) in ['Unchecked', 'Checked', 'Disabled unchecked', 'Disabled checked', 'Enable auto save', 'Format on save', 'Disabled option', 'Disabled selected option']" :key="name" style="display:flex;align-items:center;min-height:22px" :data-index="index">
        <Checkbox class="fixture-checkbox" :data-control-index="index" v-model:checked="values[index]" :label="index >= 4 ? name : undefined" :aria-label="name" :disabled="index === 2 || index === 3 || index >= 6"
          @change="(checked, viaKeyboard) => changes.push({ index, checked, viaKeyboard })" />
      </div>
    </form>
    <button class="outside">Move focus outside</button>
  </div>
</template>
