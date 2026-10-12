import type { SelectBoxOption } from '../src/components/select-box/types';
export const selectOptions: SelectBoxOption[] = [
  { text: 'JavaScript', detail: '.js', decoratorRight: 'Default', description: 'JavaScript source files.' },
  { text: 'TypeScript', detail: '.ts', description: 'TypeScript source files with static type checking.' },
  { text: 'Unavailable language', disabled: true, description: 'This extension is not installed.' },
  { text: '─────────', separator: true },
  { text: 'JSON', detail: '.json', description: 'Structured configuration and data.' },
  { text: 'Markdown', detail: '.md', description: 'Formatted text and documentation.' },
  { text: 'Plain Text', decoratorRight: 'UTF-8', description: 'Plain text without language-specific features.' },
];
export const compactOptions: SelectBoxOption[] = [ { text: 'Auto' }, { text: 'Always' }, { text: 'Never' } ];
export const manySelectOptions: SelectBoxOption[] = Array.from({ length: 35 }, (_, index) => ({ text: `Option ${String(index + 1).padStart(2, '0')}`, disabled: index === 9 || index === 10 }));
export const selectExamples = [
  { options: selectOptions, selected: 1, ariaLabel: 'Platform default' },
  { options: selectOptions, selected: 0, custom: true, ariaLabel: 'Language' },
  { options: compactOptions, selected: 1, custom: true, disabled: true, ariaLabel: 'Disabled select' },
  { options: selectOptions, selected: 4, custom: true, hideDisabled: true, ariaLabel: 'Available languages' },
  { options: compactOptions, selected: 0, custom: true, ariaLabel: 'Toolbar behavior', toolbar: true },
  { options: manySelectOptions, selected: 0, custom: true, maxVisibleOptions: 6, ariaLabel: 'Long options' },
  { options: selectOptions, selected: 5, custom: true, placement: 'above' as const, ariaLabel: 'Above select' },
  { options: [{ text: 'Use the current workspace configuration' }, { text: 'Use user configuration' }], selected: 0, custom: true, ariaLabel: 'Wide options' },
];
