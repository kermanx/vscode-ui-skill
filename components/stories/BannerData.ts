import type { BannerItem } from "../src/components/banner/types";

export const bannerItems: Record<string, BannerItem> = {
  welcome: {
    id: "welcome",
    message: "Welcome to the workspace.",
    icon: "info",
    actions: [
      {
        label: "Learn more",
        href: "#learn",
        title: "Read the workspace guide",
      },
      { label: "Configure", href: "#configure" },
    ],
  },
  warning: {
    id: "warning",
    message: "Restricted Mode is intended for safe code browsing.",
    icon: "shield",
    priority: 10,
    actions: [{ label: "Manage", href: "#trust" }],
    ariaLabel: "Workspace is in Restricted Mode",
    closeLabel: "Dismiss Restricted Mode banner",
  },
  latest: {
    id: "latest",
    message: "A new workspace is ready.",
    icon: "check",
    actions: [{ label: "Open workspace", href: "#workspace" }],
  },
  neutral: {
    id: "neutral",
    message: "Settings are synchronized.",
    icon: "cloud",
    neutral: true,
    actions: [{ label: "View settings", href: "#settings" }],
  },
  application: {
    id: "application",
    message: "Try the new editor features.",
    actions: [{ label: "Release notes", href: "#release" }],
  },
  custom: {
    id: "custom",
    message: "Your extension is ready.",
    icon: {
      url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%23c586c0' d='M8 0 16 8 8 16 0 8Z'/%3E%3C/svg%3E",
    },
  },
  plain: {
    id: "plain",
    message: "No additional actions are available.",
    icon: "info",
  },
  rich: {
    id: "rich",
    message: "Workspace ready. Read the guide.",
    icon: "info",
    ariaLabel: "Workspace ready. Read the guide.",
  },
};
