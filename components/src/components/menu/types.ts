/** A command, checked item, submenu, or visual separator. */
export type MenuEntry = MenuAction | { separator: true };
export interface MenuAction {
  id: string;
  label: string;
  disabled?: boolean;
  checked?: boolean;
  /** Display text only; the application owns registering shortcuts. */
  keybinding?: string;
  children?: readonly MenuEntry[];
}
