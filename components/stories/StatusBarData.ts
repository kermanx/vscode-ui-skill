import {
  StatusBarShowTooltipCommand,
  StatusBarToggleTooltipCommand,
  type StatusBarEntry,
} from "../src/components/status-bar/types";
export const statusBarEntries: StatusBarEntry[] = [
  {
    id: "remote",
    name: "Remote connection",
    text: "$(remote) SSH: dev",
    ariaLabel: "Connected to dev",
    command: "remote.open",
    kind: "remote",
    priority: 1000,
    tooltip: "Open a remote window",
  },
  {
    id: "branch",
    name: "Git branch",
    text: "$(git-branch) main*",
    ariaLabel: "Git branch main, modified",
    command: { id: "git.checkout", arguments: ["main"] },
    priority: 100,
    tooltip: "Switch branch",
  },
  {
    id: "sync",
    name: "Synchronize changes",
    text: "$(sync) 2↓ 1↑",
    ariaLabel: "Synchronize: two incoming, one outgoing",
    command: "git.sync",
    priority: {
      location: { id: "branch", priority: 99 },
      alignment: "right",
      compact: true,
    },
    tooltip: "Synchronize changes",
  },
  {
    id: "problems",
    name: "Problems",
    text: "$(error) 2 $(warning) 1",
    ariaLabel: "2 errors and 1 warning",
    command: "problems.show",
    priority: 50,
    tooltip: {
      content: "Workspace problems",
      commands: [{ id: "problems.show", title: "Show Problems" }],
    },
  },
  {
    id: "position",
    name: "Cursor position",
    text: "Ln 8, Col 12",
    ariaLabel: "Line 8, Column 12",
    alignment: "right",
    priority: 100,
    command: "cursor.go",
    tooltip: "Go to Line/Column",
  },
  {
    id: "indent",
    name: "Indentation",
    text: "Spaces: 2",
    ariaLabel: "Spaces: 2",
    alignment: "right",
    priority: 80,
    command: "indent.change",
    tooltip: "Select indentation",
  },
  {
    id: "encoding",
    name: "Encoding",
    text: "UTF-8",
    ariaLabel: "UTF-8",
    alignment: "right",
    priority: 50,
    command: "encoding.change",
  },
  {
    id: "language",
    name: "Language mode",
    text: "TypeScript",
    ariaLabel: "TypeScript",
    alignment: "right",
    priority: 30,
    command: "language.change",
  },
  {
    id: "notifications",
    name: "Notifications",
    text: "$(bell)",
    ariaLabel: "Notifications",
    alignment: "right",
    priority: -100,
    command: StatusBarToggleTooltipCommand,
    tooltip: "No new notifications",
    showBeak: true,
  },
];
export const statusBarKinds: StatusBarEntry[] = [
  "standard",
  "warning",
  "error",
  "prominent",
  "remote",
  "offline",
].map((kind, index) => ({
  id: `kind-${kind}`,
  name: kind,
  text: `$(circle-filled) ${kind}`,
  ariaLabel: kind,
  kind: kind as StatusBarEntry["kind"],
  command: `kind.${kind}`,
  priority: 100 - index,
  tooltip: `${kind} status`,
}));
statusBarKinds.push({
  id: "information",
  name: "Information",
  text: "Read-only information",
  ariaLabel: "Read-only information",
  priority: -1,
  tooltip: "An entry without a command",
});
export function statusBarVariant(variant: string) {
  if (variant === "kinds") return statusBarKinds.map((entry) => ({ ...entry }));
  if (variant === "progress")
    return [
      {
        id: "loading",
        name: "Loading",
        text: "Loading workspace",
        ariaLabel: "Loading workspace",
        showProgress: true,
        priority: 100,
      },
      {
        id: "syncing",
        name: "Syncing",
        text: "Synchronizing",
        ariaLabel: "Synchronizing",
        showProgress: "syncing",
        command: "sync",
        priority: 90,
      },
      {
        id: "escaped",
        name: "Literal icons",
        text: "\\$(check) $(check) Ready",
        ariaLabel: "Literal icons and ready",
        priority: 80,
      },
    ] as StatusBarEntry[];
  if (variant === "priority")
    return [
      {
        id: "a",
        name: "A",
        text: "A",
        ariaLabel: "A",
        priority: { primary: 10, secondary: 1 },
      },
      {
        id: "b",
        name: "B",
        text: "B",
        ariaLabel: "B",
        priority: { primary: 10, secondary: 2 },
      },
      {
        id: "before",
        name: "Before",
        text: "Before B",
        ariaLabel: "Before B",
        priority: { location: { id: "b", priority: 0 }, alignment: "left" },
      },
      {
        id: "after",
        name: "After",
        text: "After B",
        ariaLabel: "After B",
        priority: {
          location: { id: "b", priority: 0 },
          alignment: "right",
          compact: true,
        },
      },
      {
        id: "missing",
        name: "Missing",
        text: "Missing reference",
        ariaLabel: "Missing reference",
        priority: {
          location: { id: "absent", priority: 50 },
          alignment: "right",
        },
      },
      {
        id: "right-low",
        name: "Right low",
        text: "R1",
        ariaLabel: "R1",
        alignment: "right",
        priority: 1,
      },
      {
        id: "right-high",
        name: "Right high",
        text: "R2",
        ariaLabel: "R2",
        alignment: "right",
        priority: 2,
      },
    ] as StatusBarEntry[];
  if (variant === "tooltip")
    return [
      {
        id: "show",
        name: "Show tooltip",
        text: "Show details",
        ariaLabel: "Show details",
        command: StatusBarShowTooltipCommand,
        tooltip: {
          content: "Status details stay open while you inspect them.",
          commands: [{ id: "status.inspect", title: "Inspect" }],
        },
        priority: 100,
      },
      {
        id: "toggle",
        name: "Toggle tooltip",
        text: "Toggle details",
        ariaLabel: "Toggle details",
        command: StatusBarToggleTooltipCommand,
        tooltip: "Pinned details",
        priority: 90,
      },
      {
        id: "long",
        name: "Long tooltip",
        text: "Long details",
        ariaLabel: "Long details",
        tooltip: Array.from(
          { length: 50 },
          (_, index) => `Line ${index + 1}: additional status information.`,
        ).join("\n"),
        priority: 80,
      },
    ] as StatusBarEntry[];
  return statusBarEntries.map((entry) => ({ ...entry }));
}
