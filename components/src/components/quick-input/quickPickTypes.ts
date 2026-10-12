// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
import type { QuickInputButton, QuickInputProps } from './types';
import type { Match } from '../icon-label/iconLabel';
import type { Chord } from '../keybinding-label/types';

export interface QuickPickItemButton extends QuickInputButton {
  alwaysVisible?: boolean;
}
export interface QuickPickItem {
  id: string;
  type?: 'item';
  label: string;
  ariaLabel?: string;
  description?: string;
  detail?: string;
  icon?: string;
  iconPath?: { dark: string; light?: string };
  /** A theme token such as `symbolIcon.functionForeground`. */
  iconColor?: string;
  italic?: boolean;
  strikethrough?: boolean;
  tooltip?: string;
  keybinding?: readonly Chord[];
  highlights?: {
    label?: readonly Match[];
    description?: readonly Match[];
    detail?: readonly Match[];
  };
  buttons?: readonly QuickPickItemButton[];
  disabled?: boolean;
  alwaysShow?: boolean;
  pickable?: boolean;
}
export interface QuickPickSeparator {
  id: string;
  type: 'separator';
  label?: string;
  description?: string;
  ariaLabel?: string;
  tooltip?: string;
  buttons?: readonly QuickPickItemButton[];
}
export type QuickPickEntry = QuickPickItem | QuickPickSeparator;
export type QuickPickActivation = 'first' | 'second' | 'last' | 'none';
export type QuickPickFocus =
  | 'first'
  | 'second'
  | 'last'
  | 'next'
  | 'previous'
  | 'nextPage'
  | 'previousPage'
  | 'nextSeparator'
  | 'previousSeparator';
export interface QuickPickProps extends Omit<QuickInputProps, 'password'> {
  items: readonly QuickPickEntry[];
  /** Transform only the filter text, preserving the displayed input (for Quick Access prefixes). */
  filterValue?: (value: string) => string;
  canSelectMany?: boolean;
  canAcceptInBackground?: boolean;
  matchOnLabel?: boolean;
  matchOnLabelMode?: 'fuzzy' | 'contiguous';
  matchOnDescription?: boolean;
  matchOnDetail?: boolean;
  sortByLabel?: boolean;
  keepScrollPosition?: boolean;
  itemActivation?: QuickPickActivation;
  hideInput?: boolean;
  hideCountBadge?: boolean;
  hideCheckAll?: boolean;
  ok?: boolean | 'default';
  okLabel?: string;
}
export interface QuickPickKeyMods {
  ctrlCmd: boolean;
  alt: boolean;
  shift: boolean;
}
export interface QuickPickAcceptEvent {
  selectedIds: string[];
  inBackground: boolean;
  keyMods: QuickPickKeyMods;
}
export interface QuickPickWillAcceptEvent {
  veto(): void;
}
export interface QuickPickItemButtonEvent {
  itemId: string;
  buttonId: string;
}
export interface QuickPickSeparatorButtonEvent {
  separatorId: string;
  buttonId: string;
}
