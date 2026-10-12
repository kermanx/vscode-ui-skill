<script setup lang="ts">
import { onMounted, ref } from "vue";
import NotificationsList from "../src/components/notifications/NotificationsList.vue";
import type {
  NotificationItem,
  NotificationPosition,
  NotificationsListHandle,
} from "../src/components/notifications/types";
import {
  notificationItems,
  manyNotifications,
  plainNotification,
} from "./NotificationsData";
import {
  hasActiveProgress,
  hasPrimaryActions,
} from "../src/components/notifications/notificationState";
defineProps<{ theme?: string }>();
const params = new URLSearchParams(location.search),
  position = (params.get("position") || "bottom-right") as NotificationPosition;
const items = ref<readonly NotificationItem[]>(
  structuredClone(
    params.get("large") === "true" ? manyNotifications() : notificationItems,
  ),
);
const expanded = ref<readonly string[]>([]),
  list = ref<NotificationsListHandle>();
const closes = ref<string[]>([]),
  actions = ref<object[]>([]),
  links = ref<string[]>([]),
  copies = ref<string[]>([]),
  filters = ref<object[]>([]);
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
      focus: list.value?.getFocus() ? [list.value.getFocus()] : [],
      closes: [...closes.value],
      actions: [...actions.value],
      links: [...links.value],
      copies: [...copies.value],
      filters: [...filters.value],
      position,
    }),
  });
  (window as any).fixtureApi = {
    focus: () => list.value?.focusFirst(),
    update: () => {
      items.value = items.value.map((item) =>
        item.id === "info"
          ? { ...item, message: "Workspace information was updated." }
          : item,
      );
    },
    add: () => {
      items.value = [{ ...plainNotification }, ...items.value];
    },
    progress: () => {
      items.value = items.value.map((item) =>
        item.id === "progress" ? { ...item, progress: { done: true } } : item,
      );
    },
    clear: () => {
      for (const item of items.value)
        if (!hasActiveProgress(item)) closes.value.push(item.id);
      items.value = items.value.filter(hasActiveProgress);
    },
  };
  (window as any).fixtureReady = true;
});
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div
      class="specimen"
      data-testid="specimen"
      style="width: 450px; max-width: 100%; min-height: 42px"
    >
      <NotificationsList
        ref="list"
        v-model:items="items"
        v-model:expanded-ids="expanded"
        :position="position"
        :max-height="280"
        @close="closes.push($event)"
        @action="(id, action) => actions.push({ id, action })"
        @link="(_id, href) => links.push(href)"
        @copy="(_id, text) => copies.push(text)"
        @filter="(id, filtered) => filters.push({ id, filtered })"
      />
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
