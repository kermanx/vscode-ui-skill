<script setup lang="ts">
import { ref } from 'vue';
import './compositeContent.css';
defineProps<{ label: string; kind: 'activity' | 'panel'; visible?: boolean }>();
const content = ref<HTMLElement>();
defineExpose({ focus: () => content.value?.focus() });
</script>
<template>
  <section ref="content" v-show="visible !== false" class="fixture-composite-content" :class="kind"
    tabindex="-1" :aria-label="`${label} content`" data-composite-content>
    <strong>{{ label }}</strong>
    <p>View content receives focus when opened.</p>
  </section>
</template>
