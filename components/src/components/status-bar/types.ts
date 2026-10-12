export type StatusBarAlignment = 'left' | 'right';
export type StatusBarEntryKind =
  | 'standard'
  | 'warning'
  | 'error'
  | 'prominent'
  | 'remote'
  | 'offline';
export interface StatusBarLocation {
  location: { id: string; priority: number };
  alignment: StatusBarAlignment;
  compact?: boolean;
}
export interface StatusBarPriority {
  primary: number | StatusBarLocation;
  secondary: number;
}
export interface StatusBarCommand {
  id: string;
  title?: string;
  arguments?: readonly unknown[];
}
export interface StatusBarTooltip {
  content: string;
  commands: readonly StatusBarCommand[];
}
export interface StatusBarEntry {
  id: string;
  name: string;
  text: string;
  ariaLabel: string;
  alignment?: StatusBarAlignment;
  priority?: number | StatusBarPriority | StatusBarLocation;
  role?: string;
  tooltip?: string | StatusBarTooltip;
  command?: string | StatusBarCommand;
  kind?: StatusBarEntryKind;
  showBeak?: boolean;
  showProgress?: boolean | 'loading' | 'syncing';
}
/** Special entry commands are objects, like ordinary command descriptors. */
export const StatusBarShowTooltipCommand: StatusBarCommand = {
  id: 'statusBar.entry.showTooltip',
  title: '',
};
export const StatusBarToggleTooltipCommand: StatusBarCommand = {
  id: 'statusBar.entry.toggleTooltip',
  title: '',
};
