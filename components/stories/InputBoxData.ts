import type { InputBoxAction, InputBoxMessage } from '../src/components/input-box/types';
export const inputBoxExamples: { value: string; placeholder?: string; ariaLabel: string; password?: boolean; readonly?: boolean; disabled?: boolean; showPlaceholderOnFocus?: boolean; message?: InputBoxMessage; history?: string[]; actions?: InputBoxAction[]; validation?: boolean }[] = [
  { value: '', placeholder: 'Search files', ariaLabel: 'Search files' },
  { value: 'project/src/main.ts', ariaLabel: 'File path' },
  { value: 'secret-token', password: true, ariaLabel: 'Access token' },
  { value: '/workspace/project', readonly: true, ariaLabel: 'Read-only path' },
  { value: 'Unavailable', disabled: true, ariaLabel: 'Disabled input' },
  { value: '', placeholder: 'Type when focused', showPlaceholderOnFocus: true, ariaLabel: 'Focus placeholder' },
  { value: 'demo', ariaLabel: 'Information', message: { type: 'info', content: 'Use a descriptive project name.' } },
  { value: 'existing-name', ariaLabel: 'Warning', message: { type: 'warning', content: 'A project with this name already exists.' } },
  { value: 'invalid', ariaLabel: 'Email', validation: true },
  { value: '', placeholder: 'Find', ariaLabel: 'History and actions', history: ['alpha', 'beta', 'gamma'], actions: [
    { id: 'clear', label: 'Clear input', icon: 'clear-all' },
    { id: 'search', label: 'Find next', icon: 'arrow-down' },
    { id: 'unavailable', label: 'Unavailable action', icon: 'replace', disabled: true },
  ] },
];
export function validateEmail(value: string): InputBoxMessage | null {
  return value.includes('@') ? null : { type: 'error', content: 'Enter an email address with an @ sign.' };
}
