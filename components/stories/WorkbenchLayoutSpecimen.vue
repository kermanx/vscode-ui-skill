<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import WorkbenchLayout from "../src/components/workbench/WorkbenchLayout.vue";
import { workbenchParts, workbenchPartStyle } from "./WorkbenchLayoutData";
const props = defineProps<{ theme: string }>();
const side =
  new URLSearchParams(location.search).get("side") === "right"
    ? "right"
    : "left";
const state = reactive({
  sidebarVisible: true,
  panelVisible: true,
  activityBarVisible: true,
  statusBarVisible: true,
  sidebarWidth: 220,
  panelHeight: 180,
});
const themeClass = computed(
  () =>
    ({ dark: "vs-dark", light: "vs", hcDark: "hc-black", hcLight: "hc-light" })[
      props.theme
    ],
);
const root = ref<InstanceType<typeof WorkbenchLayout>>();
onMounted(async () => {
  await nextTick();
  Object.assign(window, {
    fixtureReady: true,
    fixtureState: state,
    fixtureApi: {
      set: (value: object) => Object.assign(state, value),
      focus: root.value?.focus,
    },
  });
});
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme" :class="themeClass">
    <div class="specimen" data-testid="specimen" style="height: 520px">
      <WorkbenchLayout
        ref="root"
        :sidebar-side="side"
        v-model:sidebar-visible="state.sidebarVisible"
        v-model:panel-visible="state.panelVisible"
        v-model:activity-bar-visible="state.activityBarVisible"
        v-model:status-bar-visible="state.statusBarVisible"
        v-model:sidebar-width="state.sidebarWidth"
        v-model:panel-height="state.panelHeight"
        ><template v-for="part in workbenchParts" #[part]
          ><div :style="workbenchPartStyle(part)">{{ part }}</div></template
        ></WorkbenchLayout
      >
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
