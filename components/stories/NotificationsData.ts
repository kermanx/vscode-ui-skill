import type { NotificationItem } from "../src/components/notifications/types";
export const notificationItems: NotificationItem[] = [
  {
    id: "info",
    message: [
      "Workspace is ready. ",
      {
        label: "Read the guide",
        href: "https://example.com/guide",
        title: "Workspace guide",
      },
      ".",
    ],
    source: "Workspace",
  },
  {
    id: "warning",
    severity: "warning",
    message:
      "The current workspace contains generated files and unsaved changes.\nReview the build settings before publishing this project to a shared environment.",
    source: "Build Tools",
  },
  {
    id: "error",
    severity: "error",
    message: "The extension could not connect to the service.",
    source: { id: "extension", label: "Remote Tools" },
    actions: {
      primary: [
        {
          id: "retry",
          label: "Retry",
          keepOpen: true,
          menu: [
            { id: "retry-all", label: "Retry all connections", keepOpen: true },
            { id: "work-offline", label: "Work offline" },
          ],
        },
        { id: "ignore", label: "Ignore" },
      ],
      secondary: [
        { id: "logs", label: "Open logs" },
        { id: "settings", label: "Connection settings" },
      ],
    },
  },
  {
    id: "progress",
    message: "Downloading workspace dependencies…",
    source: "Package Manager",
    progress: { total: 100, worked: 35 },
  },
];
export const plainNotification: NotificationItem = {
  id: "plain",
  message: "Changes saved.",
};
export function manyNotifications(): NotificationItem[] {
  return Array.from({ length: 10000 }, (_, index) => ({
    id: `notification-${index}`,
    message: `Workspace notification ${index}`,
    severity: index % 3 === 0 ? "warning" : "info",
  }));
}
