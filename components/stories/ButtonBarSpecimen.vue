<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import ButtonBar from '../src/components/button-bar/ButtonBar.vue';
import { buttonBarExamples } from './ButtonBarData';
defineProps<{ theme?: string }>();
const clicks = ref<string[]>([]), actions = ref<string[]>([]);
watch([clicks, actions], () => { (window as any).fixtureState = { clicks: clicks.value, actions: actions.value }; }, { deep: true, immediate: true });
onMounted(() => { (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen button-specimen" data-testid="specimen">
      <ButtonBar v-for="(example, index) in buttonBarExamples" :key="index" :data-index="index" :items="example.items" :alignment="example.alignment" :style="example.style"
        @click="clicks.push($event)" @action="(id, actionId) => actions.push(`${id}:${actionId}`)" />
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
