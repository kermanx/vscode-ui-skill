import type { DropdownAction } from '../src/components/button/dropdownTypes';
export const dropdownActions: DropdownAction[] = [
  { id: 'new-window', label: 'Open in New Window' },
  { id: 'workspace', label: 'Add Folder to Workspace', disabled: true },
  { separator: true },
  { id: 'auto-save', label: 'Auto Save', checked: true },
];
export const dropdownExamples = [
  { label: 'Open Folder', secondary: false, disabled: false },
  { label: 'Run Task', secondary: true, disabled: false },
  { label: 'Unavailable', secondary: false, disabled: true },
];
