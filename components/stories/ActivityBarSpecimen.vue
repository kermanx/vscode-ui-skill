<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import ActivityBar from "../src/components/activity-bar/ActivityBar.vue";
import CompositeContent from './CompositeContent.vue';
import { activityBarItems } from "./ActivityBarData";
import type { CompositeItem } from "../src/components/composite-bar/types";
defineProps<{ theme?: string }>();
const params = new URLSearchParams(location.search),
  entries = ref(activityBarItems()),
  bar = ref<InstanceType<typeof ActivityBar>>();
const content = ref<InstanceType<typeof CompositeContent>>();
const activeId = ref(params.get("active") || "explorer"),
  visible = ref(params.get("visible") !== "false");
const state = {
  opens: [] as unknown[],
  visibility: [] as boolean[],
  badges: [] as unknown[],
  commands: [] as unknown[],
  activeId: activeId.value,
  visible: visible.value,
};
function open(id: string, focus: boolean) {
  state.opens.push({ id, focus });
  state.activeId = activeId.value;
  state.visible = visible.value;
  if (focus) void nextTick(() => content.value?.focus());
}
function visibility(value: boolean) {
  state.visibility.push(value);
  state.visible = value;
}
onMounted(() => {
  Object.assign(window, {
    fixtureState: state,
    fixtureReady: true,
    fixtureApi: {
      focus: (index?: number) => bar.value?.focus(index),
      badge: (id: string, badges: CompositeItem["badges"]) => {
        const item = entries.value.find((item) => item.id === id);
        if (item) item.badges = badges;
      },
      activate: (id: string) => (activeId.value = id),
      pin: (id: string) => bar.value?.pin(id),
      unpin: (id: string) => bar.value?.unpin(id),
      afterTick: nextTick,
    },
  });
});
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div
      class="specimen"
      data-testid="specimen"
      style="width: 48px; height: 360px; position: relative"
    >
      <ActivityBar
        ref="bar"
        v-model:active-id="activeId"
        v-model:sidebar-visible="visible"
        :items="entries"
        :side="params.get('side') === 'right' ? 'right' : 'left'"
        :icon-click-behavior="
          params.get('clickBehavior') === 'focus' ? 'focus' : 'toggle'
        "
        @open="open"
        @visibility="visibility"
        @badge="(id, enabled) => state.badges.push({ id, enabled })"
        @command="(id, ...args) => state.commands.push({ id, args })"
      />
    </div>
    <CompositeContent ref="content" kind="activity" :label="entries.find(item => item.id === activeId)?.label || activeId" :visible="visible" />
    <button class="outside">Move focus outside</button>
  </div>
</template>
