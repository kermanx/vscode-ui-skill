import type { DropdownAction } from '../button/dropdownTypes';
interface ButtonBarBaseItem {
  id: string;
  label: string;
  secondary?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}
export type ButtonBarItem = ButtonBarBaseItem & ({
  icon?: string;
  small?: boolean;
  description?: string;
  actions?: never;
} | {
  actions: readonly DropdownAction[];
  includePrimary?: boolean;
  icon?: never;
  small?: never;
  description?: never;
});
