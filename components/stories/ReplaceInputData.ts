import type { InputBoxMessage } from '../src/components/input-box/types';
export const replaceExamples = [
  { value: '', ariaLabel: 'Replace text' },
  { value: 'Replacement', preserveCase: true, ariaLabel: 'Preserve replacement case' },
  { value: 'Disabled replacement', disabled: true, preserveCase: true, ariaLabel: 'Disabled replace' },
  { value: 'Options hidden', showOptions: false, preserveCase: true, ariaLabel: 'Hidden preserve option' },
  { value: 'Keep option focus', focusInputOnOptionClick: false, preserveCaseTitleSuffix: ' (⌥⌘P)', ariaLabel: 'Keep replacement option focus' },
  { value: '', history: ['first replacement', 'newValue', 'last replacement'], ariaLabel: 'Replace history' },
  { value: 'blocked', validation: true, ariaLabel: 'Validated replacement' },
  { value: 'First line\nSecond line', multiline: true, ariaLabel: 'Multiline replacement' },
  { value: Array.from({ length: 12 }, (_, i) => `Replacement line ${i + 1}`).join('\n'), multiline: true, maxHeight: 118, ariaLabel: 'Editor replacement height limit' },
  { value: 'A longer replacement phrase that wraps onto the following line. '.repeat(5), multiline: true, wrap: true, maxHeight: 134, ariaLabel: 'Search replacement height limit' },
];
export function validateReplacement(value: string): InputBoxMessage | null {
  return value === 'blocked' ? { type: 'warning', content: 'This value is reserved by the example application.' } : null;
}
export const compositionSample = 'Example EXAMPLE example';
export const compositionStyle = 'display:flex;flex-direction:column;gap:8px;width:300px';
