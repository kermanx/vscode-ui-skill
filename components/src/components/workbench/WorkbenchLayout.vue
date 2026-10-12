<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import SplitView from "../split-view/SplitView.vue";
import type { SplitViewItem, SplitViewLayout } from "../split-view/types";
const props = withDefaults(
  defineProps<{
    sidebarSide?: "left" | "right";
    preferredSidebarWidth?: number;
  }>(),
  { sidebarSide: "left", preferredSidebarWidth: 300 },
);
const sidebarVisible = defineModel<boolean>("sidebarVisible", {
  default: true,
});
const panelVisible = defineModel<boolean>("panelVisible", { default: true });
const activityBarVisible = defineModel<boolean>("activityBarVisible", {
  default: true,
});
const statusBarVisible = defineModel<boolean>("statusBarVisible", {
  default: true,
});
const sidebarWidth = defineModel<number>("sidebarWidth", { default: 300 });
const panelHeight = defineModel<number>("panelHeight", { default: 300 });
const root = ref<HTMLElement>(),
  horizontal = ref<InstanceType<typeof SplitView>>(),
  vertical = ref<InstanceType<typeof SplitView>>();
const columns = computed<SplitViewItem[]>(() => {
  const activity: SplitViewItem = {
    id: "activity",
    size: 48,
    minimumSize: 48,
    maximumSize: 48,
    proportionalLayout: false,
    visible: activityBarVisible.value,
  };
  const sidebar: SplitViewItem = {
    id: "sidebar",
    size: sidebarWidth.value,
    minimumSize: 170,
    priority: "low",
    proportionalLayout: false,
    snap: true,
    visible: sidebarVisible.value,
  };
  const center: SplitViewItem = {
    id: "center",
    size: 10000,
    minimumSize: panelVisible.value ? 300 : 220,
    priority: "high",
    proportionalLayout: false,
  };
  return props.sidebarSide === "left"
    ? [activity, sidebar, center]
    : [center, sidebar, activity];
});
const frameRows = computed<SplitViewItem[]>(() => [
  {
    id: "main",
    size: 10000,
    minimumSize: panelVisible.value ? 147 : 70,
    priority: "high",
    proportionalLayout: false,
  },
  {
    id: "status",
    size: 22,
    minimumSize: 22,
    maximumSize: 22,
    proportionalLayout: false,
    visible: statusBarVisible.value,
  },
]);
const rows = computed<SplitViewItem[]>(() => [
  {
    id: "editor",
    size: 10000,
    minimumSize: 70,
    priority: "high",
    proportionalLayout: false,
  },
  {
    id: "panel",
    size: panelHeight.value,
    minimumSize: 77,
    proportionalLayout: false,
    snap: true,
    visible: panelVisible.value,
  },
]);
function horizontalLayout(layout: SplitViewLayout) {
  const index = columns.value.findIndex((view) => view.id === "sidebar");
  sidebarVisible.value = layout.visible[index]!;
  if (layout.visible[index]) sidebarWidth.value = layout.sizes[index]!;
}
function verticalLayout(layout: SplitViewLayout) {
  panelVisible.value = layout.visible[1]!;
  if (layout.visible[1]) panelHeight.value = layout.sizes[1]!;
}
watch(sidebarWidth, (value) => {
  const index = columns.value.findIndex((view) => view.id === "sidebar");
  if (sidebarVisible.value) horizontal.value?.resizeView(index, value);
});
watch(panelHeight, (value) => {
  if (panelVisible.value) vertical.value?.resizeView(1, value);
});
function resetSidebar() {
  sidebarWidth.value = Math.round(props.preferredSidebarWidth);
}
function resetPanel() {
  panelHeight.value = Math.round((root.value?.clientHeight || 750) * 0.4);
}
function focus(part: "activity" | "sidebar" | "editor" | "panel" | "status") {
  root.value
    ?.querySelector<HTMLElement>(
      `[data-workbench-part="${part}"] [tabindex="0"], [data-workbench-part="${part}"] button, [data-workbench-part="${part}"] input`,
    )
    ?.focus();
}
function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value;
}
function togglePanel() {
  panelVisible.value = !panelVisible.value;
}
defineExpose({ focus, toggleSidebar, togglePanel, resetSidebar, resetPanel });
</script>
<template>
  <div ref="root" class="vc-workbench-layout" role="application">
    <SplitView :views="frameRows" :proportional-layout="false">
      <template #main>
        <div class="vc-workbench-main">
          <SplitView
            ref="horizontal"
            orientation="horizontal"
            :views="columns"
            :proportional-layout="false"
            @layout="horizontalLayout"
            @sash-reset="resetSidebar"
          >
            <template #activity>
              <div data-workbench-part="activity" class="vc-workbench-part">
                <slot name="activity" />
              </div>
            </template>
            <template #sidebar>
              <div data-workbench-part="sidebar" class="vc-workbench-part">
                <slot name="sidebar" />
              </div>
            </template>
            <template #center>
              <SplitView
                ref="vertical"
                :views="rows"
                :proportional-layout="false"
                @layout="verticalLayout"
                @sash-reset="resetPanel"
              >
                <template #editor>
                  <div data-workbench-part="editor" class="vc-workbench-part">
                    <slot name="editor" />
                  </div>
                </template>
                <template #panel>
                  <div data-workbench-part="panel" class="vc-workbench-part">
                    <slot name="panel" />
                  </div>
                </template>
              </SplitView>
            </template>
          </SplitView>
        </div>
      </template>
      <template #status>
        <div data-workbench-part="status" class="vc-workbench-status">
          <slot name="status" />
        </div>
      </template>
    </SplitView>
    <slot name="overlays" />
  </div>
</template>
<style>
.vc-workbench-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--vscode-editor-background);
}
.vc-workbench-main,
.vc-workbench-part {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.vc-workbench-status {
  position: relative;
  height: 22px;
  width: 100%;
  overflow: hidden;
}
</style>
