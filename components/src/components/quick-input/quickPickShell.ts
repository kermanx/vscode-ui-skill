/** Private QuickInputController state supplied by the picker composition. */
export interface QuickPickShellState {
  canSelectMany: boolean;
  hideInput: boolean;
  hideCountBadge: boolean;
  hideCheckAll: boolean;
  visibleCount: number;
  selectedCount: number;
  allVisibleChecked: boolean;
  showOk: boolean;
  okLabel: string;
  activeDescendant?: string;
}
