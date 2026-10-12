export const actionBarActions = [
  { id: 'add', label: 'New File', icon: 'new-file' },
  { id: 'refresh', label: 'Refresh', icon: 'refresh', disabled: true },
  { id: 'pin', label: 'Pin', icon: 'pin', checked: true },
  { separator: true as const },
  { id: 'run', label: 'Run', keybinding: '⌘R' },
  { id: 'stop', label: 'Stop', disabled: true },
  { id: 'watch', label: 'Watch', checked: false },
];
export const actionBarCases = [
  { id: 'horizontal', label: 'File actions', orientation: 'horizontal' as const },
  { id: 'vertical', label: 'Vertical actions', orientation: 'vertical' as const },
  { id: 'enabled-only', label: 'Enabled actions', orientation: 'horizontal' as const, focusOnlyEnabledItems: true, preventLoopNavigation: true },
];
