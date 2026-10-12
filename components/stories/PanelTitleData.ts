import type { CompositeItem } from '../src/components/composite-bar/types';
import type { ActionBarEntry } from '../src/components/action-bar/types';
import type { MenuEntry } from '../src/components/menu/types';
export function panelTitleItems(): CompositeItem[] {
  return [
    { id: 'problems', label: 'Problems', icon: 'error', badges: [{ type: 'number', value: 7, description: '7 problems' }] },
    { id: 'output', label: 'Output', icon: 'output' },
    { id: 'debug-console', label: 'Debug Console', icon: 'debug-console' },
    { id: 'terminal', label: 'Terminal', icon: 'terminal' },
    { id: 'ports', label: 'Ports', icon: 'plug', pinned: false },
  ];
}
export const panelTitlePrimary: ActionBarEntry[] = [
  { id: 'split', label: 'Split Terminal', icon: 'split-horizontal' },
  { id: 'maximize', label: 'Maximize Panel Size', icon: 'chevron-up' },
  { id: 'close', label: 'Hide Panel', icon: 'close' },
];
export const panelTitleSecondary: MenuEntry[] = [{ id: 'configure', label: 'Configure Tasks...' }, { id: 'clear', label: 'Clear Output' }];
