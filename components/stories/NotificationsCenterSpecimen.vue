<script setup lang="ts">
import { onMounted, ref } from "vue";
import NotificationsCenter from "../src/components/notifications/NotificationsCenter.vue";
import type {
  NotificationItem,
  NotificationPosition,
  NotificationsCenterHandle,
} from "../src/components/notifications/types";
import {
  notificationItems,
  manyNotifications,
  plainNotification,
} from "./NotificationsData";
import { hasPrimaryActions } from "../src/components/notifications/notificationState";
defineProps<{ theme?: string }>();
const params = new URLSearchParams(location.search);
const open = ref(params.get("open") !== "false"),
  center = ref<NotificationsCenterHandle>(),
  surface = ref<HTMLElement>(),
  outside = ref<HTMLButtonElement>();
const position = ref<NotificationPosition>(
  (params.get("position") || "bottom-right") as NotificationPosition,
);
const statusBarVisible = params.get("statusBar") !== "false",
  titleBarVisible = params.get("titleBar") === "true";
const height = ref(480),
  items = ref<readonly NotificationItem[]>(
    structuredClone(
      params.get("empty") === "true"
        ? []
        : params.get("large") === "true"
          ? manyNotifications()
          : notificationItems,
    ),
  );
const sources =
  params.get("sources") === "many"
    ? Array.from({ length: 12 }, (_, index) => ({
        id: `source-${index}`,
        label: `Source ${String(index).padStart(2, "0")}`,
      }))
    : [
        ...new Map(
          notificationItems.flatMap((item) =>
            typeof item.source === "object"
              ? [[item.source.id, item.source] as const]
              : [],
          ),
        ).values(),
      ];
const expanded = ref<readonly string[]>([]),
  muted = ref<readonly string[]>([]),
  doNotDisturb = ref(false);
const closes = ref<string[]>([]),
  actions = ref<object[]>([]),
  links = ref<string[]>([]),
  copies = ref<string[]>([]),
  filters = ref<object[]>([]),
  restoreFocus = ref(0),
  manageSources = ref(0);
function restore() {
  restoreFocus.value++;
  outside.value?.focus();
}
function add(item: NotificationItem = plainNotification) {
  items.value = [item, ...items.value.filter((value) => value.id !== item.id)];
}
onMounted(() => {
  Object.defineProperty(window, "fixtureState", {
    configurable: true,
    get: () => ({
      items: items.value.map((item) => item.id),
      expanded: items.value
        .filter(
          (item) => hasPrimaryActions(item) || expanded.value.includes(item.id),
        )
        .map((item) => item.id),
      visible: open.value,
      focus: [
        ...surface.value!.querySelectorAll<HTMLElement>(
          ".monaco-list-row.focused",
        ),
      ].map((row) => items.value[Number(row.dataset.index)]?.id),
      closes: [...closes.value],
      actions: [...actions.value],
      links: [...links.value],
      copies: [...copies.value],
      filters: [...filters.value],
      restoreFocus: restoreFocus.value,
      manageSources: manageSources.value,
      position: position.value,
      statusBarVisible,
      titleBarVisible,
      doNotDisturb: doNotDisturb.value,
    }),
  });
  (window as any).fixtureApi = {
    show: () => center.value?.show(),
    hide: () => center.value?.hide(),
    clear: () => center.value?.clearAll(),
    focus: () => center.value?.focus(),
    add,
    progress: () => {
      items.value = items.value.map((item) =>
        item.id === "progress" ? { ...item, progress: { done: true } } : item,
      );
    },
    resize: (value: number) => {
      height.value = value;
    },
  };
  (window as any).fixtureReady = true;
});
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div
      ref="surface"
      class="specimen"
      data-testid="specimen"
      :style="{
        width: '720px',
        maxWidth: '100%',
        height: `${height}px`,
        position: 'relative',
      }"
    >
      <NotificationsCenter
        ref="center"
        v-model:open="open"
        v-model:items="items"
        v-model:expanded-ids="expanded"
        v-model:position="position"
        v-model:do-not-disturb="doNotDisturb"
        v-model:muted-source-ids="muted"
        :sources="sources"
        :status-bar-visible="statusBarVisible"
        :title-bar-visible="titleBarVisible"
        @close="closes.push($event)"
        @action="(id, action) => actions.push({ id, action })"
        @link="(_id, href) => links.push(href)"
        @copy="(_id, text) => copies.push(text)"
        @filter="(id, filtered) => filters.push({ id, filtered })"
        @restore-focus="restore"
        @manage-sources="manageSources++"
      />
    </div>
    <button ref="outside" class="outside">Move focus outside</button>
  </div>
</template>
