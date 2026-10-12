import { NotificationsCenter } from "../../vscode/src/vs/workbench/browser/parts/notifications/notificationsCenter.js";
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
import { IMenuService } from "../../vscode/src/vs/platform/actions/common/actions.js";
import { MenuService } from "../../vscode/src/vs/platform/actions/common/menuService.js";
import { IStorageService } from "../../vscode/src/vs/platform/storage/common/storage.js";
import { IQuickInputService } from "../../vscode/src/vs/platform/quickinput/common/quickInput.js";
import { Emitter, Event } from "../../vscode/src/vs/base/common/event.js";
import { Dimension } from "../../vscode/src/vs/base/browser/dom.js";
import { notificationServices } from "./notification-services";
import { addNotification } from "./notification-model";
import {
  notificationItems,
  manyNotifications,
  plainNotification,
} from "../../components/stories/NotificationsData";
import type { NotificationItem } from "../../components/src/components/notifications/types";

export function mountNotificationsCenter(
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
    manageSources: 0,
    position: params.get("position") || "bottom-right",
    statusBarVisible: params.get("statusBar") !== "false",
    titleBarVisible: params.get("titleBar") === "true",
    doNotDisturb: false,
  });
  Object.defineProperty(state, "sources", {
    value:
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
          ],
  });
  surface.className = `specimen monaco-workbench${state.statusBarVisible ? "" : " nostatusbar"}`;
  surface.style.cssText =
    "width:720px;max-width:100%;height:480px;position:relative";
  const services = notificationServices(root, state),
    model = new NotificationsModel(),
    layoutEvent = new Emitter<Dimension>();
  const initial =
    params.get("empty") === "true"
      ? []
      : params.get("large") === "true"
        ? manyNotifications()
        : notificationItems;
  for (const item of [...initial].reverse())
    addNotification(model, item, state);
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
  services.collection.set(IStorageService, {
    get: (_key: string, _scope: unknown, fallback: string) => fallback,
    onDidChangeValue: () => Event.None,
    store() {},
    remove() {},
  } as any);
  services.collection.set(
    IMenuService,
    services.instantiation.createInstance(MenuService),
  );
  services.collection.set(IQuickInputService, {
    createQuickPick: () => ({
      show: () => state.manageSources++,
      onDidAccept: Event.None,
      onDidHide: Event.None,
      dispose() {},
    }),
  } as any);
  const center = services.instantiation.createInstance(
    NotificationsCenter,
    surface,
    model,
  );
  const layout = () =>
    layoutEvent.fire(new Dimension(surface.clientWidth, surface.clientHeight));
  layout();
  new ResizeObserver(layout).observe(surface);
  model.onDidChangeNotification((event) => {
    if (event.kind === NotificationChangeType.REMOVE)
      state.closes.push(event.item.id);
  });
  registerNotificationCommands(
    center,
    {
      focus() {},
      focusNext() {},
      focusPrevious() {},
      focusFirst() {},
      focusLast() {},
      hide() {},
    },
    model,
  );
  window.addEventListener("keydown", (event) => {
    const inList =
      event.target instanceof Element &&
      !!event.target.closest(".notifications-list-container");
    if (!inList && !(event.key === "Escape" && center.isVisible)) return;
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
        ArrowDown: "list.focusDown",
        ArrowUp: "list.focusUp",
        Home: "list.focusFirst",
        End: "list.focusLast",
        PageDown: "list.focusPageDown",
        PageUp: "list.focusPageUp",
        Escape: "notifications.hideList",
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
    visible: { enumerable: true, get: () => center.isVisible },
    focus: {
      enumerable: true,
      get: () =>
        (center as any).notificationsList?.list
          ?.getFocusedElements()
          .map((item: any) => item.id) || [],
    },
  });
  (window as any).fixtureApi = {
    show: () => center.show(),
    hide: () => center.hide(),
    clear: () => center.clearAll(),
    focus: () => center.show(),
    add: (item: NotificationItem = plainNotification) =>
      addNotification(model, item, state),
    progress: () =>
      model.notifications
        .find((item) => item.id === "progress")
        ?.progress.done(),
    resize: (height: number) => {
      surface.style.height = `${height}px`;
      layout();
    },
  };
  if (params.get("open") !== "false") center.show();
}
