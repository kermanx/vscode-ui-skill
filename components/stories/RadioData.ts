import type { RadioOption } from '../src/components/radio/types';
export const radioExamples: { label: string; options: RadioOption[]; selected: number; segmented?: boolean; arrowKeyBehavior?: 'select' | 'focus'; disabled?: boolean }[] = [
  { label: 'Wrapping', selected: 0, options: [{ text: 'Off' }, { text: 'Auto' }, { text: 'Always', disabled: true }] },
  { label: 'View', selected: 1, options: [{ text: '$(list-flat) List', tooltip: 'List view' }, { text: '$(list-tree)', ariaLabel: 'Tree view', tooltip: 'Show as a tree' }] },
  { label: 'Size', selected: 0, arrowKeyBehavior: 'focus', options: [{ text: 'Small' }, { text: 'Medium', disabled: true }, { text: 'Large' }] },
  { label: 'Disabled group', selected: 1, disabled: true, options: [{ text: 'Off' }, { text: 'On' }] },
  { label: 'Location', selected: 1, segmented: true, options: [{ text: 'Local' }, { text: 'Remote' }, { text: '$(cloud) Cloud' }] },
  { label: 'Quality', selected: 0, segmented: true, arrowKeyBehavior: 'focus', options: [{ text: 'Low' }, { text: 'Medium' }, { text: 'High' }] },
  { label: 'Dynamic options', selected: 0, options: [{ text: 'One' }, { text: 'Two' }] },
];
export const replacementRadioOptions: RadioOption[] = [{ text: 'Alpha' }, { text: 'Beta', disabled: true }, { text: '$(check) Gamma', isActive: true }];
