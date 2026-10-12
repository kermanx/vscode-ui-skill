export interface EditorTab {
  id: string;
  label: string;
  description?: string;
  forceDescription?: boolean;
  title?: string;
  icon?: string;
  preview?: boolean;
  sticky?: boolean;
  dirty?: boolean;
  cannotClose?: boolean;
}
export interface EditorTabsProps {
  items: readonly EditorTab[];
  active?: boolean;
  compact?: boolean;
  showIcons?: boolean;
  showIndex?: boolean;
  highlightModifiedTabs?: boolean;
  sizing?: "fit" | "shrink" | "fixed";
  fixedMinWidth?: number;
  fixedMaxWidth?: number;
  stickySizing?: "normal" | "compact" | "shrink";
  actionLocation?: "left" | "right";
  reserveActionSpace?: boolean;
  showClose?: boolean;
  showUnpin?: boolean;
  scrollbar?: "auto" | "visible" | "hidden";
  scrollbarSize?: "default" | "large";
  preventStickyClose?: "keyboardAndMouse" | "keyboard" | "mouse" | "never";
  doubleClickAction?: "expand" | "maximize" | "off";
}
