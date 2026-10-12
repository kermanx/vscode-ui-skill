<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import IconButton from '../src/components/icon-button/IconButton.vue';
import { iconButtonExamples } from './IconButtonData';
defineProps<{ theme?: string }>();
const examples = ref(iconButtonExamples.map(example => ({ ...example })));
const clicks = ref<{ index: number; type: string }[]>([]);
const bubbled = ref(0);
watch([clicks, bubbled], () => { (window as any).fixtureState = { clicks: clicks.value, bubbled: bubbled.value }; }, { deep: true, immediate: true });
onMounted(() => { (window as any).fixtureReady = true; });
function update() { examples.value[0] = { icon: 'new-folder', label: 'New Folder', tooltip: 'Create a folder' }; examples.value[1].disabled = false; examples.value[2].checked = false; }
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen button-specimen" data-testid="specimen" @click="bubbled++">
      <div v-for="(example, index) in examples" :key="index" :data-index="index" style="display:flex;align-items:center;height:22px">
        <IconButton v-bind="example" @click="clicks.push({ index, type: $event.type })" />
      </div>
      <div style="display:flex;align-items:center;height:22px;gap:4px"><span style="margin-right:auto">Project files</span>
        <IconButton data-index="5" icon="new-file" label="Add file" @click="clicks.push({ index: 5, type: $event.type })" />
        <IconButton data-index="6" icon="collapse-all" label="Collapse all" @click="clicks.push({ index: 6, type: $event.type })" />
      </div>
    </div>
    <button class="outside">Move focus outside</button>
    <button class="fixture-update" @click="update">Update properties</button>
  </div>
</template>
