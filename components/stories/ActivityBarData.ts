import type { CompositeItem } from "../src/components/composite-bar/types";
export function activityBarItems(): CompositeItem[] {
  return [
    { id: "explorer", label: "Explorer", icon: "files", keybinding: "⇧⌘E" },
    { id: "search", label: "Search", icon: "search", keybinding: "⇧⌘F" },
    {
      id: "source-control",
      label: "Source Control",
      icon: "source-control",
      badges: [
        { type: "number", value: 12, description: "12 pending changes" },
      ],
    },
    {
      id: "debug",
      label: "Run and Debug",
      icon: "debug-alt",
      badges: [
        {
          type: "icon",
          icon: "warning",
          description: "Configuration required",
        },
      ],
    },
    {
      id: "extensions",
      label: "Extensions",
      icon: "extensions",
      badges: [{ type: "progress", description: "Installing extension" }],
    },
    {
      id: "testing",
      label: "Testing",
      icon: "beaker",
      badges: [{ type: "number", value: 1200, description: "1200 tests" }],
    },
    { id: "ports", label: "Ports", icon: "plug", pinned: false },
  ];
}
