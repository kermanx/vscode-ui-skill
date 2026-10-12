<script setup lang="ts">
import { onMounted, ref } from "vue";
import NotificationToasts from "../src/components/notifications/NotificationToasts.vue";
import type {
  NotificationItem,
  NotificationPosition,
  NotificationToastsHandle,
} from "../src/components/notifications/types";
import { notificationItems, plainNotification } from "./NotificationsData";
import { hasPrimaryActions } from "../src/components/notifications/notificationState";
defineProps<{ theme?: string }>();
const params = new URLSearchParams(location.search);
const position = ref<NotificationPosition>(
  (params.get("position") || "bottom-right") as NotificationPosition,
);
const statusBarVisible = params.get("statusBar") !== "false",
  titleBarVisible = params.get("titleBar") === "true";
const centerVisible = ref(false),
  height = ref(480),
  surface = ref<HTMLElement>(),
  outside = ref<HTMLButtonElement>();
const items = ref<readonly NotificationItem[]>(
  structuredClone(params.get("empty") === "true" ? [] : notificationItems),
);
const expanded = ref<readonly string[]>([]),
  toasts = ref<NotificationToastsHandle>();
const closes = ref<string[]>([]),
  actions = ref<object[]>([]),
  links = ref<string[]>([]),
  copies = ref<string[]>([]),
  filters = ref<object[]>([]),
  restoreFocus = ref(0);
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
      visible: [
        ...surface.value!.querySelectorAll<HTMLElement>(
          ".notification-toast-container",
        ),
      ].map((element) => element.dataset.id),
      focus: [
        ...surface.value!.querySelectorAll<HTMLElement>(
          ".notification-toast-container",
        ),
      ]
        .filter((element) => element.contains(document.activeElement))
        .map((element) => element.dataset.id),
      closes: [...closes.value],
      actions: [...actions.value],
      links: [...links.value],
      copies: [...copies.value],
      filters: [...filters.value],
      restoreFocus: restoreFocus.value,
      position: position.value,
      statusBarVisible,
      titleBarVisible,
      centerVisible: centerVisible.value,
    }),
  });
  (window as any).fixtureApi = {
    focus: () => toasts.value?.focus(),
    focusFirst: () => toasts.value?.focusFirst(),
    focusLast: () => toasts.value?.focusLast(),
    focusNext: () => toasts.value?.focusNext(),
    focusPrevious: () => toasts.value?.focusPrevious(),
    hide: () => toasts.value?.hide(),
    add,
    progress: () => {
      items.value = items.value.map((item) =>
        item.id === "progress" ? { ...item, progress: { done: true } } : item,
      );
    },
    center: () => {
      centerVisible.value = !centerVisible.value;
    },
    position: (value: NotificationPosition) => {
      position.value = value;
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
      <NotificationToasts
        ref="toasts"
        v-model:items="items"
        v-model:expanded-ids="expanded"
        :position="position"
        :status-bar-visible="statusBarVisible"
        :title-bar-visible="titleBarVisible"
        :center-visible="centerVisible"
        @restore-focus="restore"
        @close="closes.push($event)"
        @action="(id, action) => actions.push({ id, action })"
        @link="(_id, href) => links.push(href)"
        @copy="(_id, text) => copies.push(text)"
        @filter="(id, filtered) => filters.push({ id, filtered })"
      />
    </div>
    <button ref="outside" class="outside">Move focus outside</button>
  </div>
</template>
