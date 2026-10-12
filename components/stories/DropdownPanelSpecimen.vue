<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Dropdown from '../src/components/dropdown/Dropdown.vue';
import Menu from '../src/components/menu/Menu.vue';
import { menuActions } from './menuData';
defineProps<{ theme?: string }>();
const actions = ref<string[]>([]);
watch(actions, () => { (window as any).fixtureState = { actions: actions.value }; }, { immediate: true, deep: true });
onMounted(() => { (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen button-specimen" data-testid="specimen">
      <div v-for="(disabled, index) in [false, true]" :key="index" :data-index="index" style="width:184px;height:24px">
        <Dropdown :label="disabled ? 'Unavailable' : 'More Actions'" :disabled="disabled" v-slot="{ close }">
          <Menu :actions="menuActions" @action="id => { actions.push(id); close(); }" @cancel="close" />
        </Dropdown>
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
