import type { ButtonBarItem } from '../src/components/button-bar/types';
export const buttonBarExamples: { alignment: 'horizontal' | 'vertical'; style: string; items: ButtonBarItem[] }[] = [
  { alignment: 'horizontal', style: 'display:flex;gap:8px', items: [
    { id: 'save', label: 'Save', icon: 'check' }, { id: 'disabled', label: 'Unavailable', secondary: true, disabled: true }, { id: 'cancel', label: 'Cancel', secondary: true, small: true },
  ] },
  { alignment: 'horizontal', style: 'display:flex;gap:8px', items: [
    { id: 'open', label: 'Open Folder', actions: [{ id: 'new-window', label: 'Open in New Window' }, { id: 'blocked', label: 'Add to Workspace', disabled: true }] },
    { id: 'back', label: 'Back', secondary: true },
  ] },
  { alignment: 'vertical', style: 'display:flex;flex-direction:column;gap:8px', items: [
    { id: 'install', label: 'Install', icon: 'extensions', description: '$(info) Enable for this workspace' },
    { id: 'later', label: 'Later', secondary: true, description: 'Keep the current configuration' },
  ] },
];
