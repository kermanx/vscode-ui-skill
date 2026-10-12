<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Switch from '../src/components/switch/Switch.vue';
import './SwitchSpecimen.css';
defineProps<{ theme?: string }>();
const values = ref([false, true, false, true, false, true]);
const disabled = ref([false, false, true, true, false, true]);
const labels = ref(['Off switch', 'On switch', 'Disabled off', 'Disabled on', 'Choose model automatically', 'Organization policy']);
const changes = ref<{ index: number; checked: boolean }[]>([]);
const bubbled = ref(0), submits = ref(0);
watch([values, changes, bubbled, submits], () => { (window as any).fixtureState = { values: values.value, changes: changes.value, bubbled: bubbled.value, submits: submits.value }; }, { deep: true, immediate: true });
onMounted(() => { (window as any).fixtureReady = true; });
function update() { values.value[0] = true; disabled.value[2] = false; labels.value[0] = 'Updated setting'; }
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <form class="specimen button-specimen" data-testid="specimen" @submit.prevent="submits++" @click="bubbled++">
      <div v-for="index in 4" :key="index" :data-index="index - 1" style="display:flex;align-items:center;min-height:22px">
        <Switch v-model:checked="values[index - 1]" :ariaLabel="labels[index - 1]" :disabled="disabled[index - 1]" @change="checked => changes.push({ index: index - 1, checked })" />
      </div>
      <div v-for="index in [4, 5]" :key="index" class="action-widget" :data-index="index" style="display:flex;align-items:center;min-height:22px">
        <div class="tabbed-action-list-tab-toggle"><span>{{ index === 4 ? 'Auto' : 'Managed' }}</span>
          <Switch v-model:checked="values[index]" :ariaLabel="labels[index]" :disabled="disabled[index]" :title="index === 4 ? 'Pick the best model for each request' : 'This setting is controlled by your organization'"
            :aria-description="index === 4 ? 'Pick the best model for each request' : 'This setting is controlled by your organization'" @change="checked => changes.push({ index, checked })" />
        </div>
      </div>
    </form>
    <button class="outside">Move focus outside</button>
    <button class="fixture-update" @click="update">Update properties</button>
  </div>
</template>
