import { NotificationsToasts } from "../../vscode/src/vs/workbench/browser/parts/notifications/notificationsToasts.js";
import {
  NotificationsModel,
  NotificationChangeType,
} from "../../vscode/src/vs/workbench/common/notifications.js";
import { registerNotificationCommands } from "../../vscode/src/vs/workbench/browser/parts/notifications/notificationsCommands.js";
import { CommandsRegistry } from "../../vscode/src/vs/platform/commands/common/commands.js";
import {
  IWorkbenchLayoutService,
  Parts,
} from "../../vscode/src/vs/workbench/services/layout/browser/layoutService.js";
import { IEditorGroupsService } from "../../vscode/src/vs/workbench/services/editor/common/editorGroupsService.js";
import { ILifecycleService } from "../../vscode/src/vs/workbench/services/lifecycle/common/lifecycle.js";
import { IHostService } from "../../vscode/src/vs/workbench/services/host/browser/host.js";
import { IWorkbenchEnvironmentService } from "../../vscode/src/vs/workbench/services/environment/common/environmentService.js";
import { Emitter } from "../../vscode/src/vs/base/common/event.js";
import { Dimension } from "../../vscode/src/vs/base/browser/dom.js";
import { notificationServices } from "./notification-services";
import { addNotification } from "./notification-model";
import {
  notificationItems,
  plainNotification,
} from "../../components/stories/NotificationsData";
import type { NotificationItem } from "../../components/src/components/notifications/types";

export function mountNotificationToasts(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
) {
  for (const key of Object.keys(state)) delete state[key];
  const params = new URLSearchParams(location.search);
  Object.assign(state, {
    closes: [],
    actions: [],
    links: [],
    copies: [],
    filters: [],
    restoreFocus: 0,
    position: params.get("position") || "bottom-right",
    statusBarVisible: params.get("statusBar") !== "false",
    titleBarVisible: params.get("titleBar") === "true",
    centerVisible: false,
  });
  surface.className = `specimen monaco-workbench${state.statusBarVisible ? "" : " nostatusbar"}`;
  surface.style.cssText =
    "width:720px;max-width:100%;height:480px;position:relative";
  const services = notificationServices(root, state),
    model = new NotificationsModel();
  const initial = params.get("empty") === "true" ? [] : notificationItems;
  for (const item of [...initial].reverse())
    addNotification(model, item, state);
  const layoutEvent = new Emitter<Dimension>(),
    focusEvent = new Emitter<boolean>();
  services.collection.set(IWorkbenchLayoutService, {
    mainContainer: surface,
    onDidLayoutMainContainer: layoutEvent.event,
    isVisible: (part: string) =>
      part === Parts.STATUSBAR_PART
        ? state.statusBarVisible
        : part === Parts.TITLEBAR_PART
          ? state.titleBarVisible
          : true,
  } as any);
  services.collection.set(IEditorGroupsService, {
    activeGroup: {
      focus: () => {
        state.restoreFocus++;
        root.querySelector<HTMLButtonElement>(".outside")?.focus();
      },
    },
  } as any);
  services.collection.set(ILifecycleService, {
    when: () => Promise.resolve(),
  } as any);
  services.collection.set(IHostService, {
    get hasFocus() {
      return document.hasFocus();
    },
    onDidChangeFocus: focusEvent.event,
  } as any);
  services.collection.set(IWorkbenchEnvironmentService, {
    enableSmokeTestDriver: false,
  } as any);
  window.addEventListener("focus", () => focusEvent.fire(true));
  window.addEventListener("blur", () => focusEvent.fire(false));
  const toasts = services.instantiation.createInstance(
    NotificationsToasts,
    surface,
    model,
  );
  const layout = () => {
    layoutEvent.fire(new Dimension(surface.clientWidth, surface.clientHeight));
  };
  layout();
  new ResizeObserver(layout).observe(surface);
  model.onDidChangeNotification((event) => {
    if (event.kind === NotificationChangeType.REMOVE)
      state.closes.push(event.item.id);
  });
  services.notification.onDidChangeFilter(() =>
    model.setFilter({ sources: services.filters }),
  );
  registerNotificationCommands(
    { isVisible: false, show() {}, hide() {}, clearAll() {} },
    toasts,
    model,
  );
  window.addEventListener("keydown", (event) => {
    const inList =
      event.target instanceof Element &&
      !!event.target.closest(".notifications-list-container");
    if (!inList && !(event.key === "Escape" && toasts.isVisible)) return;
    const mac = navigator.platform.includes("Mac");
    if (
      event.altKey ||
      event.shiftKey ||
      event.ctrlKey ||
      (event.metaKey && !(mac && event.key === "Backspace"))
    )
      return;
    const command = (
      {
        ArrowDown: "notifications.focusNextToast",
        ArrowUp: "notifications.focusPreviousToast",
        Home: "notifications.focusFirstToast",
        End: "notifications.focusLastToast",
        PageDown: "notifications.focusLastToast",
        PageUp: "notifications.focusFirstToast",
        Escape: "notifications.hideToasts",
        ArrowRight: "notification.expand",
        ArrowLeft: "notification.collapse",
        Enter: "notification.toggle",
        " ": "notification.toggle",
        Delete: mac ? undefined : "notification.clear",
        Backspace: mac && event.metaKey ? "notification.clear" : undefined,
      } as Record<string, string | undefined>
    )[event.key];
    if (command) {
      services.instantiation.invokeFunction((accessor) =>
        CommandsRegistry.getCommand(command)!.handler(accessor),
      );
      event.preventDefault();
    }
  });
  const records = () =>
    [...(toasts as any).mapNotificationToToast.values()] as any[];
  Object.defineProperties(state, {
    items: {
      enumerable: true,
      get: () => model.notifications.map((item) => item.id),
    },
    expanded: {
      enumerable: true,
      get: () =>
        model.notifications
          .filter((item) => item.expanded)
          .map((item) => item.id),
    },
    visible: {
      enumerable: true,
      get: () =>
        records()
          .filter((value) => value.container.parentElement)
          .reverse()
          .map((value) => value.item.id),
    },
    focus: {
      enumerable: true,
      get: () =>
        records()
          .filter((value) => value.list.hasFocus())
          .map((value) => value.item.id),
    },
  });
  const add = (item: NotificationItem = plainNotification) =>
    addNotification(model, item, state);
  (window as any).fixtureApi = {
    focus: () => toasts.focus(),
    focusFirst: () => toasts.focusFirst(),
    focusLast: () => toasts.focusLast(),
    focusNext: () => toasts.focusNext(),
    focusPrevious: () => toasts.focusPrevious(),
    hide: () => toasts.hide(),
    add,
    progress: () =>
      model.notifications
        .find((item) => item.id === "progress")
        ?.progress.done(),
    center: () => {
      state.centerVisible = !state.centerVisible;
      toasts.update(state.centerVisible);
    },
    position: (value: string) => {
      state.position = value;
      services.configurationChanged.fire({
        affectsConfiguration: (key: string) =>
          key === "workbench.notifications.position",
      });
    },
    resize: (height: number) => {
      surface.style.height = `${height}px`;
      layout();
    },
  };
}
