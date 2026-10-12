<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import PanelTitle from "../src/components/panel-title/PanelTitle.vue";
import CompositeContent from './CompositeContent.vue';
import { panelTitleItems, panelTitlePrimary, panelTitleSecondary } from "./PanelTitleData";
import type { CompositeItem } from "../src/components/composite-bar/types";
defineProps<{ theme?: string }>();
const params = new URLSearchParams(location.search),
  entries = ref(panelTitleItems()),
  bar = ref<InstanceType<typeof PanelTitle>>();
const content = ref<InstanceType<typeof CompositeContent>>();
const activeId = ref(params.get("active") || "problems"),
  visible = ref(params.get("visible") !== "false");
const state = {
  opens: [] as unknown[],
  visibility: [] as boolean[],
  badges: [] as unknown[],
  commands: [] as unknown[],
  actions: [] as string[],
  activeId: activeId.value,
  visible: visible.value,
};
function open(id: string, focus: boolean) {
  state.opens.push({ id, focus });
  state.activeId = activeId.value;
  state.visible = visible.value;
  if (focus) void nextTick(() => content.value?.focus());
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
      style="height: 35px; position: relative"
    >
      <PanelTitle
        ref="bar"
        v-model:active-id="activeId"
        :items="entries"
        :icons="params.get('icons') === 'true'"
        :primary="panelTitlePrimary" :secondary="panelTitleSecondary"
        @action="state.actions.push($event)"
        @open="open"
        @badge="(id, enabled) => state.badges.push({ id, enabled })"
        @command="(id, ...args) => state.commands.push({ id, args })"
      />
    </div>
    <CompositeContent ref="content" kind="panel" :label="entries.find(item => item.id === activeId)?.label || activeId" :visible="visible" />
    <button class="outside">Move focus outside</button>
  </div>
</template>
