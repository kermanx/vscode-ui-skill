<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import ContextMenu from "../context-menu/ContextMenu.vue";
import type { MenuEntry } from "../menu/types";
import { provideInstantHoverDelegate } from "../tooltip/delegate";
import StatusBarEntryView from "./StatusBarEntry.vue";
import { compactGroups, orderEntries } from "./model";
import type { StatusBarEntry, StatusBarCommand } from "./types";
import "./statusbar.css";
const props = withDefaults(
  defineProps<{
    entries: readonly StatusBarEntry[];
    hasFolder?: boolean;
    inactive?: boolean;
    ariaLabel?: string;
  }>(),
  { hasFolder: true, inactive: false, ariaLabel: "Status Bar" },
);
const hiddenIds = defineModel<string[]>("hiddenIds", { default: () => [] });
const hiddenState = ref<string[]>([]);
watch(
  hiddenIds,
  (value) => {
    hiddenState.value = [...value];
  },
  { immediate: true, deep: true, flush: "sync" },
);
const emit = defineEmits<{
  command: [command: string | StatusBarCommand, entry: StatusBarEntry];
  visibility: [id: string, visible: boolean];
  escape: [];
  hide: [];
}>();
provideInstantHoverDelegate();
const element = ref<HTMLElement>(),
  contextMenu = ref<InstanceType<typeof ContextMenu>>();
const views = new Map<
    StatusBarEntry,
    InstanceType<typeof StatusBarEntryView>
  >(),
  callbacks = new WeakMap<StatusBarEntry, (value: unknown) => void>();
function itemRef(entry: StatusBarEntry) {
  let callback = callbacks.get(entry);
  if (!callback) {
    callback = (value) => {
      if (value)
        views.set(entry, value as InstanceType<typeof StatusBarEntryView>);
      else views.delete(entry);
    };
    callbacks.set(entry, callback);
  }
  return callback;
}
// Keep each mounted item stable when ordering changes. Match object identity first;
// an updated descriptor may then reuse an unmatched item with the same public id.
let previousKeys = new Map<StatusBarEntry, symbol>();
const entryKeys = computed(() => {
  const next = new Map<StatusBarEntry, symbol>();
  const available = new Map(previousKeys);
  for (const entry of props.entries) {
    const key = available.get(entry);
    if (key) {
      next.set(entry, key);
      available.delete(entry);
    }
  }
  for (const entry of props.entries) {
    if (next.has(entry)) continue;
    const previous = [...available].find(([item]) => item.id === entry.id);
    next.set(entry, previous?.[1] ?? Symbol(entry.id));
    if (previous) available.delete(previous[0]);
  }
  previousKeys = next;
  return next;
});
const entries = computed(() => orderEntries(props.entries));
const groups = computed(() => compactGroups(entries.value, hiddenState.value));
const left = computed(() =>
  entries.value.filter((entry) => entry.alignment !== "right"),
);
const right = computed(() =>
  entries.value.filter((entry) => entry.alignment === "right").reverse(),
);
const hovered = ref<string>();
const colors = ref<Record<string, string>>({}),
  highContrast = ref(false);
const platform =
  typeof navigator !== "undefined" && /Mac/.test(navigator.platform)
    ? "mac"
    : undefined;
let themeObserver: MutationObserver | undefined;
function refreshTheme() {
  if (!element.value) return;
  const theme = element.value.closest<HTMLElement>(".vc-theme"),
    style = getComputedStyle(element.value);
  const ids = [
    "statusBar.background",
    "statusBar.foreground",
    "statusBar.inactiveBackground",
    "statusBar.noFolderBackground",
    "statusBar.noFolderForeground",
    "statusBar.border",
    "statusBar.noFolderBorder",
    "statusBar.focusBorder",
    "statusBarItem.focusBorder",
    "statusBarItem.hoverBackground",
    "statusBarItem.compactHoverBackground",
    "contrastBorder",
    "contrastActiveBorder",
  ];
  colors.value = Object.fromEntries(
    ids.map((id) => [
      id,
      style.getPropertyValue(`--vscode-${id.replaceAll(".", "-")}`).trim(),
    ]),
  );
  highContrast.value =
    theme?.dataset.theme === "hcDark" || theme?.dataset.theme === "hcLight";
}
const border = computed(
  () =>
    colors.value[
      props.hasFolder ? "statusBar.border" : "statusBar.noFolderBorder"
    ] || colors.value.contrastBorder,
);
const background = computed(
  () =>
    (props.hasFolder &&
      props.inactive &&
      colors.value["statusBar.inactiveBackground"]) ||
    colors.value[
      props.hasFolder ? "statusBar.background" : "statusBar.noFolderBackground"
    ],
);
const style = computed(() => ({
  backgroundColor: background.value,
  color:
    colors.value[
      props.hasFolder ? "statusBar.foreground" : "statusBar.noFolderForeground"
    ],
  "--status-border-top-color": border.value,
  "--vc-statusbar-focus": colors.value["statusBar.focusBorder"],
  "--vc-statusbar-entry-focus":
    colors.value.contrastActiveBorder ||
    colors.value["statusBarItem.focusBorder"],
  "--vc-statusbar-focus-offset": border.value ? "-2px" : "-1px",
  "--vc-statusbar-beak": border.value || background.value,
}));
function hoverBackground(entry: StatusBarEntry) {
  if (!hovered.value || highContrast.value) return undefined;
  const group = groups.value.groups.find((group) => group.has(hovered.value!));
  if (!group?.has(entry.id)) return undefined;
  return colors.value[
    hovered.value === entry.id
      ? "statusBarItem.compactHoverBackground"
      : "statusBarItem.hoverBackground"
  ];
}
let lastFocused: StatusBarEntry | undefined,
  focusTimer: ReturnType<typeof setTimeout> | undefined;
function focusedEntry() {
  return entries.value.find((entry) =>
    views.get(entry)?.element?.contains(document.activeElement),
  );
}
function focus(preserveEntryFocus = true) {
  element.value?.focus();
  clearTimeout(focusTimer);
  if (
    preserveEntryFocus &&
    lastFocused &&
    !hiddenState.value.includes(lastFocused.id)
  )
    focusTimer = setTimeout(
      () => lastFocused && views.get(lastFocused)?.focus(),
      0,
    );
}
function move(delta: number) {
  const current = focusedEntry(),
    ordered = entries.value;
  let index = current
    ? ordered.indexOf(current) + delta
    : delta > 0
      ? 0
      : ordered.length - 1;
  const find = () => {
    while (
      index >= 0 &&
      index < ordered.length &&
      hiddenState.value.includes(ordered[index]!.id)
    )
      index += delta;
    return ordered[index];
  };
  let entry = find();
  if (!entry) {
    index = delta > 0 ? 0 : ordered.length - 1;
    entry = find();
  }
  if (entry) {
    lastFocused = entry;
    views.get(entry)?.focus();
  }
}
function keyboard(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (["ArrowRight", "ArrowDown"].includes(event.key)) move(1);
  else if (["ArrowLeft", "ArrowUp"].includes(event.key)) move(-1);
  else if (event.key === "Home") {
    focus(false);
    move(1);
  } else if (event.key === "End") {
    focus(false);
    move(-1);
  } else if (event.key === "Escape") {
    if (focusedEntry()) focus(false);
    else emit("escape");
  } else return;
  event.preventDefault();
  event.stopPropagation();
}
function updateEntryVisibility(id: string, visible: boolean) {
  if (hiddenState.value.includes(id) === !visible) return;
  hiddenState.value = visible
    ? hiddenState.value.filter((item) => item !== id)
    : [...hiddenState.value, id];
  hiddenIds.value = [...hiddenState.value];
  for (const entry of entries.value)
    if (entry.id === id) emit("visibility", id, visible);
}
const menuActions = ref<MenuEntry[]>([]);
const menuHandlers = new Map<string, () => void>();
async function showMenu(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  menuHandlers.clear();
  function action(
    label: string,
    run: () => void,
    checked?: boolean,
  ): MenuEntry {
    const id = String(menuHandlers.size);
    menuHandlers.set(id, run);
    return { id, label, checked };
  }
  const items: MenuEntry[] = [
      action("Hide Status Bar", () => emit("hide")),
      { separator: true },
    ],
    handled = new Set<string>();
  for (const entry of entries.value)
    if (!handled.has(entry.id)) {
      handled.add(entry.id);
      items.push(
        action(
          entry.name,
          () =>
            updateEntryVisibility(
              entry.id,
              hiddenState.value.includes(entry.id),
            ),
          !hiddenState.value.includes(entry.id),
        ),
      );
    }
  const selected = entries.value.find((entry) =>
    views.get(entry)?.element?.contains(event.target as Node),
  );
  if (selected)
    items.push(
      { separator: true },
      action(`Hide '${selected.name}'`, () =>
        updateEntryVisibility(selected.id, false),
      ),
    );
  menuActions.value = items;
  await nextTick();
  await contextMenu.value?.show(event);
}
function menuAction(id: string) {
  menuHandlers.get(id)?.();
}
onMounted(() => {
  refreshTheme();
  const theme = element.value?.closest(".vc-theme");
  if (theme) {
    themeObserver = new MutationObserver(refreshTheme);
    themeObserver.observe(theme, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });
  }
});
watch(
  () => props.entries,
  () => {
    hovered.value = undefined;
    if (lastFocused && !props.entries.includes(lastFocused)) {
      const key = previousKeys.get(lastFocused);
      lastFocused = [...entryKeys.value].find(
        ([, value]) => value === key,
      )?.[0];
    }
  },
);
onBeforeUnmount(() => {
  themeObserver?.disconnect();
  clearTimeout(focusTimer);
});
defineExpose({
  focus,
  focusNextEntry: () => move(1),
  focusPreviousEntry: () => move(-1),
  isEntryFocused: () => !!focusedEntry(),
  isEntryVisible: (id: string) => !hiddenState.value.includes(id),
  updateEntryVisibility,
});
</script>
<template>
  <footer
    ref="element"
    class="part statusbar vc-statusbar"
    :class="[platform, { 'status-border-top': !!border }]"
    tabindex="0"
    role="status"
    aria-live="off"
    :aria-label="ariaLabel"
    :style="style"
    @keydown.capture="keyboard"
    @contextmenu="showMenu"
  >
    <div class="left-items items-container">
      <StatusBarEntryView
        v-for="entry in left"
        :key="entryKeys.get(entry)"
        :ref="itemRef(entry)"
        :entry="entry"
        :item-classes="[...groups.classes.get(entry)!]"
        :hidden="hiddenState.includes(entry.id)"
        :hover-background="hoverBackground(entry)"
        @over="entry.command && (hovered = entry.id)"
        @out="hovered = undefined"
        @command="emit('command', $event, entry)"
      />
    </div>
    <div class="right-items items-container">
      <StatusBarEntryView
        v-for="entry in right"
        :key="entryKeys.get(entry)"
        :ref="itemRef(entry)"
        :entry="entry"
        :item-classes="[...groups.classes.get(entry)!]"
        :hidden="hiddenState.includes(entry.id)"
        :hover-background="hoverBackground(entry)"
        @over="entry.command && (hovered = entry.id)"
        @out="hovered = undefined"
        @command="emit('command', $event, entry)"
      />
    </div>
    <ContextMenu
      ref="contextMenu"
      :actions="menuActions"
      @action="menuAction"
    />
  </footer>
</template>
