import type {
  EditorTab,
  EditorTabsProps,
} from "../src/components/editor-tabs/types";
export const editorTabs: EditorTab[] = [
  {
    id: "main",
    label: "main.ts",
    title: "/project/src/main.ts",
    icon: "file",
    sticky: true,
  },
  {
    id: "readme",
    label: "README.md",
    title: "/project/README.md",
    icon: "markdown",
  },
  {
    id: "package",
    label: "package.json",
    title: "/project/package.json",
    icon: "json",
    dirty: true,
  },
  {
    id: "preview",
    label: "Untitled-1",
    title: "Untitled-1",
    icon: "file",
    preview: true,
  },
];
export function editorTabsCase(variant = "default"): {
  items: EditorTab[];
  activeId: string;
  options: Partial<EditorTabsProps>;
} {
  const items = structuredClone(editorTabs),
    options: Partial<EditorTabsProps> = {};
  let activeId = "readme";
  if (variant === "inactive") options.active = false;
  if (variant === "compact") options.compact = true;
  if (variant === "modified") options.highlightModifiedTabs = true;
  if (variant === "no-icons") options.showIcons = false;
  if (variant === "index") options.showIndex = true;
  if (variant === "left") options.actionLocation = "left";
  if (variant === "no-actions") {
    options.showClose = false;
    options.showUnpin = false;
  }
  if (variant === "cannot-close") items[1].cannotClose = true;
  if (variant === "sticky-compact" || variant === "sticky-shrink") {
    items[1].sticky = true;
    options.stickySizing = variant === "sticky-compact" ? "compact" : "shrink";
  }
  if (variant === "many" || variant === "shrink" || variant === "fixed") {
    items.push(
      ...Array.from({ length: 12 }, (_, index) => ({
        id: `extra-${index}`,
        label: `component-${index}.tsx`,
        icon: "file",
        dirty: index % 3 === 0,
      })),
    );
    if (variant !== "many") options.sizing = variant;
  }
  if (variant === "long") {
    items[1].label =
      "A very long editor tab name to exercise clipping and minimum size.md";
    items[1].description = "documentation";
  }
  if (variant === "duplicate")
    items.push(
      {
        id: "other",
        label: "main.ts",
        description: "/project/tests/main",
        icon: "file",
      },
      {
        id: "third",
        label: "main.ts",
        description: "/project/lib/main",
        icon: "file",
      },
    );
  return { items, activeId, options };
}
