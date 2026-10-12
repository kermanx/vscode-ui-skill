import type { TableColumn, TableRow } from "../src/components/table/types";
export const tableColumns: TableColumn[] = [
  { id: "severity", label: "", weight: 0, minimumWidth: 36, maximumWidth: 36 },
  { id: "message", label: "Message", weight: 4 },
  {
    id: "source",
    label: "Source",
    weight: 1,
    minimumWidth: 100,
    maximumWidth: 300,
  },
  {
    id: "shortcut",
    label: "Shortcut",
    weight: 1,
    minimumWidth: 100,
    maximumWidth: 300,
  },
];
export const tableRows: TableRow[] = [
  {
    id: "1",
    label: "Add missing import",
    cells: {
      severity: { icon: "error" },
      message: {
        text: "Add missing import",
        highlights: [{ start: 4, end: 11 }],
      },
      source: "TypeScript",
      shortcut: { keybinding: [{ metaKey: true, key: "." }] },
    },
  },
  {
    id: "2",
    label: "Build project",
    cells: {
      severity: { icon: "warning" },
      message: "Build project",
      source: "Workspace",
      shortcut: { keybinding: [{ metaKey: true, shiftKey: true, key: "B" }] },
    },
  },
  {
    id: "3",
    label: "Check formatting",
    cells: {
      severity: { icon: "info" },
      message: "Check formatting",
      source: "Formatter",
      shortcut: { keybinding: [{ altKey: true, shiftKey: true, key: "F" }] },
    },
  },
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `${i + 4}`,
    label: `Diagnostic ${String(i + 1).padStart(2, "0")}`,
    cells: {
      severity: { icon: i % 2 ? "warning" : "info" },
      message: `Diagnostic ${String(i + 1).padStart(2, "0")}`,
      source: i % 2 ? "TypeScript" : "Workspace",
      shortcut: "",
    },
  })),
];
export const manyTableRows: TableRow[] = Array.from(
  { length: 10000 },
  (_, i) => ({
    id: `row-${i}`,
    label: `Record ${String(i).padStart(5, "0")}`,
    cells: {
      severity: { icon: i % 2 ? "warning" : "info" },
      message: `Record ${String(i).padStart(5, "0")}`,
      source: i % 2 ? "TypeScript" : "Workspace",
      shortcut: "",
    },
  }),
);
export function changedTableRows(rows: readonly TableRow[]): TableRow[] {
  return rows.length
    ? [
        {
          id: "new",
          label: "New diagnostic",
          cells: {
            severity: { icon: "warning" },
            message: "New diagnostic",
            source: "Workspace",
            shortcut: "",
          },
        },
        ...rows.slice(1).reverse(),
      ]
    : tableRows;
}
