<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import SidebarTitle from '../src/components/sidebar-title/SidebarTitle.vue';
import { sidebarTitleExamples, sidebarTitlePrimary, sidebarTitleSecondary } from './SidebarTitleData';
defineProps<{ theme: string }>();
const examples = ref(sidebarTitleExamples.map(item => ({ ...item })));
const controls = ref<InstanceType<typeof SidebarTitle>[]>([]);
const state = { actions: [] as string[], visibility: [] as string[] };
onMounted(async () => {
  Object.assign(window, {
    fixtureState: state,
    fixtureUpdateSidebarTitle: async (title: string, actions: boolean) => {
      examples.value[5] = { id: 'dynamic', title, primary: actions ? sidebarTitlePrimary : [], secondary: actions ? sidebarTitleSecondary : [] };
      await nextTick();
    },
    fixtureFocusSidebarTitle: (index: number) => controls.value[index]?.focus(),
  });
  await nextTick();
  (window as any).fixtureReady = true;
});
</script>
<template>
  <main class="vc-theme monaco-workbench fixture-root" :data-theme="theme">
    <div class="specimen" style="display:flex;flex-direction:column;gap:14px">
      <section v-for="item in examples" :key="item.id" :data-case="item.id">
        <SidebarTitle ref="controls" v-bind="item" @action="state.actions.push(`${item.id}:${$event}`)"
          @visibility="state.visibility.push(`${item.id}:${$event}`)" />
      </section>
    </div>
    <button class="outside">Move focus outside</button>
  </main>
</template>
