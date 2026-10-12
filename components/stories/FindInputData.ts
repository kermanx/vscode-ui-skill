import type { FindInputOptionsState, FindInputToggle } from '../src/components/find-input/types';
import type { InputBoxMessage } from '../src/components/input-box/types';
export const selectionToggle: FindInputToggle = { id: 'selection', title: 'Find in Selection', icon: 'selection' };
export const findExamples = [
  { value: '', ariaLabel: 'Find text' },
  { value: 'project', matchCase: true, wholeWord: true, ariaLabel: 'Case and whole word' },
  { value: 'Disabled search', disabled: true, regex: true, ariaLabel: 'Disabled find' },
  { value: 'Options collapsed', collapsed: true, matchCase: true, ariaLabel: 'Collapsed options' },
  { value: 'Selection only', showOptions: false, additionalToggles: [selectionToggle], activeOptions: ['selection'], ariaLabel: 'Additional options only' },
  { value: 'Keep toggle focus', additionalToggles: [selectionToggle], focusInputOnOptionClick: false, ariaLabel: 'Search selection' },
  { value: '[invalid', regex: true, validation: true, ariaLabel: 'Regular expression' },
  { value: '', history: ['first query', 'project', 'last query'], ariaLabel: 'Search history' },
  { value: 'First line\nSecond line', multiline: true, ariaLabel: 'Multiline search' },
  { value: 'A long search phrase that wraps onto the following line.', multiline: true, wrap: true, ariaLabel: 'Wrapped search' },
];
export function validateFind(value: string, options: FindInputOptionsState): InputBoxMessage | null {
  if (!value || !options.regex) return null;
  try { new RegExp(value, 'gu'); return null; }
  catch (error) { return { type: 'error', content: (error as Error).message }; }
}
