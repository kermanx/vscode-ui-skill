export interface ActionBarAction {
  id: string;
  label: string;
  icon?: string;
  /** Icon actions hide their text unless this is enabled. */
  showLabel?: boolean;
  tooltip?: string;
  keybinding?: string;
  disabled?: boolean;
  checked?: boolean;
}
export type ActionBarEntry = ActionBarAction | { separator: true };
