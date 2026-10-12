import {
  ChoiceAction,
  NotificationsModel,
} from "../../vscode/src/vs/workbench/common/notifications.js";
import { NotificationText } from "../../vscode/src/vs/platform/notification/common/notificationMessage.js";
import {
  NotificationPriority,
  Severity,
} from "../../vscode/src/vs/platform/notification/common/notification.js";
import type {
  NotificationAction,
  NotificationItem,
} from "../../components/src/components/notifications/types";
export function addNotification(
  model: NotificationsModel,
  item: NotificationItem,
  state: any,
) {
  const actions = (values?: readonly NotificationAction[]): ChoiceAction[] =>
    (values || []).map(
      (action) =>
        new ChoiceAction(action.id, {
          label: action.label,
          keepOpen: action.keepOpen,
          run: () => state.actions.push({ id: item.id, action: action.id }),
          menu: action.menu?.map((child) => ({
            label: child.label,
            keepOpen: child.keepOpen,
            run: () => state.actions.push({ id: item.id, action: child.id }),
          })),
        }),
    );
  return model.addNotification({
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
      primary: actions(item.actions?.primary),
      secondary: actions(item.actions?.secondary),
    },
  });
}
