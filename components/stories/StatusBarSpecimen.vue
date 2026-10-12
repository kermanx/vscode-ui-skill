<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import StatusBar from "../src/components/status-bar/StatusBar.vue";
import { statusBarVariant } from "./StatusBarData";
import type {
  StatusBarCommand,
  StatusBarEntry,
} from "../src/components/status-bar/types";
defineProps<{ theme?: string }>();
const variant =
  new URLSearchParams(location.search).get("variant") || "default";
const entries = ref(statusBarVariant(variant)),
  hiddenIds = ref<string[]>([]),
  bar = ref<InstanceType<typeof StatusBar>>();
const state = {
  commands: [] as { id: string; args: readonly unknown[] }[],
  visibility: [] as { id: string; visible: boolean }[],
  escapes: 0,
  hides: 0,
};
function command(command: string | StatusBarCommand) {
  state.commands.push({
    id: typeof command === "string" ? command : command.id,
    args: typeof command === "string" ? [] : command.arguments || [],
  });
}
function escape() {
  state.escapes++;
  document.querySelector<HTMLButtonElement>(".outside")?.focus();
}
onMounted(() => {
  (window as any).fixtureState = state;
  (window as any).fixtureApi = {
    focus: (preserve = true) => bar.value?.focus(preserve),
    next: () => bar.value?.focusNextEntry(),
    previous: () => bar.value?.focusPreviousEntry(),
    hide: (id: string) => bar.value?.updateEntryVisibility(id, false),
    show: (id: string) => bar.value?.updateEntryVisibility(id, true),
    update: (id: string, patch: Partial<StatusBarEntry>) => {
      entries.value = entries.value.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      );
    },
    remove: (id: string) => {
      entries.value = entries.value.filter((entry) => entry.id !== id);
    },
    add: (entry: StatusBarEntry) => {
      entries.value.push(entry);
    },
    afterTick: nextTick,
  };
  (window as any).fixtureReady = true;
});
</script>
<template>
  <div
    class="vc-theme fixture-root"
    :data-theme="theme || 'dark'"
    :style="
      variant === 'inactive'
        ? { '--vscode-statusBar-inactiveBackground': '#454545' }
        : undefined
    "
  >
    <div
      class="specimen"
      data-testid="specimen"
      style="
        height: 220px;
        display: flex;
        align-items: flex-end;
        padding-bottom: 20px;
        box-sizing: border-box;
      "
    >
      <StatusBar
        ref="bar"
        v-model:hidden-ids="hiddenIds"
        :entries="entries"
        :has-folder="variant !== 'no-folder'"
        :inactive="variant === 'inactive'"
        @command="command"
        @visibility="(id, visible) => state.visibility.push({ id, visible })"
        @escape="escape"
        @hide="state.hides++"
      />
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
