<script setup lang="ts">
import { computed, onMounted, reactive, ref, watchEffect } from "vue";
import EditorTabs from "../src/components/editor-tabs/EditorTabs.vue";
import { editorTabsCase } from "./EditorTabsData";
const props = defineProps<{ theme: string }>();
const scenario = editorTabsCase(
  new URLSearchParams(location.search).get("variant") || "default",
);
const items = ref(scenario.items),
  activeId = ref(scenario.activeId),
  selectedIds = ref<string[]>([scenario.activeId]),
  options = reactive(scenario.options);
const control = ref<InstanceType<typeof EditorTabs>>();
const state = reactive({
  active: activeId.value,
  selected: [activeId.value],
  items: items.value.map((item) => item.id),
  close: [] as string[],
  pin: [] as string[],
  unpin: [] as string[],
  groupSize: [] as string[],
  context: [] as string[],
  configurePreview: 0,
});
const themeClass = computed(
  () =>
    ({ dark: "vs-dark", light: "vs", hcDark: "hc-black", hcLight: "hc-light" })[
      props.theme
    ],
);
watchEffect(() =>
  Object.assign(state, {
    active: activeId.value,
    selected: items.value
      .filter(
        (item) =>
          item.id === activeId.value || selectedIds.value.includes(item.id),
      )
      .map((item) => item.id),
    items: items.value.map((item) => item.id),
  }),
);
function close(ids: string[]) {
  for (const id of ids) {
    const index = items.value.findIndex((item) => item.id === id);
    if (index < 0) continue;
    state.close.push(id);
    items.value.splice(index, 1);
    selectedIds.value = selectedIds.value.filter((value) => value !== id);
    if (activeId.value === id)
      activeId.value = items.value[Math.min(index, items.value.length - 1)]?.id;
  }
}
function pin(id: string) {
  state.pin.push(id);
  const item = items.value.find((item) => item.id === id);
  if (item) item.preview = false;
}
function unpin(id: string) {
  state.unpin.push(id);
  const item = items.value.find((item) => item.id === id);
  if (item) item.sticky = false;
}
onMounted(() =>
  Object.assign(window, {
    fixtureReady: true,
    fixtureState: state,
    fixtureApi: {
      focus: (id?: string) => control.value?.focus(id),
      select: (id: string) => {
        activeId.value = id;
        selectedIds.value = [id];
      },
      options: (value: object) => Object.assign(options, value),
      dirty: (id: string, dirty: boolean) => {
        const item = items.value.find((item) => item.id === id);
        if (item) item.dirty = dirty;
      },
    },
  }),
);
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme" :class="themeClass">
    <div class="specimen" data-testid="specimen">
      <EditorTabs
        ref="control"
        :items="items"
        v-model:active-id="activeId"
        v-model:selected-ids="selectedIds"
        v-bind="options"
        @configure-preview="state.configurePreview++"
        @close="close"
        @pin="pin"
        @unpin="unpin"
        @toggle-group-size="state.groupSize.push($event)"
        @contextmenu="(_, item) => state.context.push(item.id)"
      />
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
