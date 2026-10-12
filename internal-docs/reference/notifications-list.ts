import { NotificationsList } from "../../vscode/src/vs/workbench/browser/parts/notifications/notificationsList.js";
import {
  NotificationsModel,
  NotificationChangeType,
  NotificationViewItemContentChangeKind,
  ChoiceAction,
} from "../../vscode/src/vs/workbench/common/notifications.js";
import { NotificationText } from "../../vscode/src/vs/platform/notification/common/notificationMessage.js";
import {
  NotificationPriority,
  Severity,
} from "../../vscode/src/vs/platform/notification/common/notification.js";
import { registerNotificationCommands } from "../../vscode/src/vs/workbench/browser/parts/notifications/notificationsCommands.js";
import { CommandsRegistry } from "../../vscode/src/vs/platform/commands/common/commands.js";
import { notificationServices } from "./notification-services";
import {
  notificationItems,
  manyNotifications,
  plainNotification,
} from "../../components/stories/NotificationsData";
import type {
  NotificationAction,
  NotificationItem,
} from "../../components/src/components/notifications/types";

export function mountNotificationsList(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
) {
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, {
    closes: [],
    actions: [],
    links: [],
    copies: [],
    filters: [],
  });
  const params = new URLSearchParams(location.search);
  state.position = params.get("position") || "bottom-right";
  surface.className = "specimen";
  surface.style.cssText = "width:450px;max-width:100%;min-height:42px";
  const services = notificationServices(root, state),
    model = new NotificationsModel();
  const list = services.instantiation.createInstance(
    NotificationsList,
    surface,
    {},
  );
  list.show();
  const update = () => list.layout(surface.clientWidth, 280);
  update();
  model.onDidChangeNotification((event) => {
    if (event.kind === NotificationChangeType.ADD) {
      list.show();
      list.updateNotificationsList(event.index, 0, [event.item]);
    } else if (event.kind === NotificationChangeType.REMOVE) {
      state.closes.push(event.item.id);
      list.updateNotificationsList(event.index, 1);
    } else if (
      event.kind === NotificationChangeType.EXPAND_COLLAPSE ||
      event.detail === NotificationViewItemContentChangeKind.ACTIONS ||
      event.activeProgressChanged
    )
      list.updateNotificationsList(event.index, 1, [event.item]);
    else if (
      event.detail === NotificationViewItemContentChangeKind.MESSAGE &&
      event.item.expanded
    )
      list.updateNotificationHeight(event.item);
    update();
  });
  const actions = (
    id: string,
    values?: readonly NotificationAction[],
  ): ChoiceAction[] =>
    (values || []).map(
      (action) =>
        new ChoiceAction(action.id, {
          label: action.label,
          keepOpen: action.keepOpen,
          run: () => state.actions.push({ id, action: action.id }),
          menu: action.menu?.map((child) => ({
            label: child.label,
            keepOpen: child.keepOpen,
            run: () => state.actions.push({ id, action: child.id }),
          })),
        }),
    );
  function add(item: NotificationItem) {
    const handle = model.addNotification({
      ...item,
      message:
        typeof item.message === "string"
          ? item.message
          : NotificationText.concat(
              ...item.message.map((part) =>
                typeof part === "string"
                  ? part
                  : NotificationText.link(part.label, part.href, part.title),
              ),
            ),
      severity:
        item.severity === "error"
          ? Severity.Error
          : item.severity === "warning"
            ? Severity.Warning
            : Severity.Info,
      priority: {
        default: NotificationPriority.DEFAULT,
        optional: NotificationPriority.OPTIONAL,
        silent: NotificationPriority.SILENT,
        urgent: NotificationPriority.URGENT,
      }[item.priority || "default"],
      actions: {
        primary: actions(item.id, item.actions?.primary),
        secondary: actions(item.id, item.actions?.secondary),
      },
    });
    return handle;
  }
  const initial =
    params.get("large") === "true" ? manyNotifications() : notificationItems;
  for (const item of [...initial].reverse()) add(item);
  const controller = {
    isVisible: true,
    show() {},
    hide() {},
    clearAll() {
      for (const item of [...model.notifications])
        if (!item.hasActiveProgress) item.close();
    },
  };
  registerNotificationCommands(
    controller,
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
    if (
      !(event.target instanceof Element) ||
      !event.target.closest(".notifications-list-container")
    )
      return;
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
        ArrowRight: "notification.expand",
        ArrowLeft: "notification.collapse",
        Enter: "notification.toggle",
        " ": "notification.toggle",
        Delete: mac ? undefined : "notification.clear",
        Backspace: mac && event.metaKey ? "notification.clear" : undefined,
      } as Record<string, string | undefined>
    )[event.key];
    if (!command) return;
    services.instantiation.invokeFunction((accessor) =>
      CommandsRegistry.getCommand(command)!.handler(accessor),
    );
    event.preventDefault();
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
    focus: {
      enumerable: true,
      get: () =>
        (list as any).list.getFocusedElements().map((item: any) => item.id),
    },
  });
  (window as any).fixtureApi = {
    focus: () => list.focusFirst(),
    update: () =>
      model.notifications
        .find((item) => item.id === "info")
        ?.updateMessage("Workspace information was updated."),
    add: () => add({ ...plainNotification }),
    progress: () =>
      model.notifications
        .find((item) => item.id === "progress")
        ?.progress.done(),
    clear: () => controller.clearAll(),
  };
  new ResizeObserver(update).observe(surface);
}
