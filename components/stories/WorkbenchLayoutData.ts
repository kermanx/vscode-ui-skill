import type { CSSProperties } from "vue";
export const workbenchParts = [
  "activity",
  "sidebar",
  "editor",
  "panel",
  "status",
] as const;
export type WorkbenchPart = (typeof workbenchParts)[number];
export const partColors: Record<WorkbenchPart, string> = {
  activity: "activityBar.background",
  sidebar: "sideBar.background",
  editor: "editor.background",
  panel: "panel.background",
  status: "statusBar.background",
};
export function workbenchPartStyle(part: WorkbenchPart): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    backgroundColor: `var(--vscode-${partColors[part].replaceAll(".", "-")})`,
    color:
      part === "status"
        ? "var(--vscode-statusBar-foreground)"
        : "var(--vscode-foreground)",
    padding: part === "activity" ? "8px 0" : "4px 8px",
    textAlign: part === "activity" ? "center" : "left",
  };
}
