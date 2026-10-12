import type { ActionBarEntry } from '../action-bar/types';
/** A stable ID preserves focus and selection when items are replaced or reordered. */
export interface ListItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  italic?: boolean;
  actions?: readonly ActionBarEntry[];
  decoration?: { badge?: string; color?: string; tooltip?: string; strikethrough?: boolean };
}
