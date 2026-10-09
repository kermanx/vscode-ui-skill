export type DropdownAction = {
  id: string;
  label: string;
  disabled?: boolean;
  checked?: boolean;
} | { separator: true };
