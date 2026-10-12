// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
import type { Match } from '../icon-label/iconLabel';
import type {
  QuickPickEntry,
  QuickPickItem,
  QuickPickProps,
  QuickPickSeparator,
} from './quickPickTypes';
import {
  compareAnything,
  getCodiconAriaLabel,
  matchesContiguousIconAware,
  matchesFuzzyIconAware,
  parseLabelWithIcons,
} from './quickPickMatch';

export interface QuickPickRow {
  entry: QuickPickEntry;
  index: number;
  childIndex: number;
  group?: QuickPickSeparator;
  separator?: QuickPickSeparator;
  hidden: boolean;
  labelHighlights?: readonly Match[];
  descriptionHighlights?: readonly Match[];
  detailHighlights?: readonly Match[];
  height: number;
  top: number;
}
export interface QuickPickModel {
  items: QuickPickRow[];
  roots: QuickPickRow[];
  children: Map<string, QuickPickRow[]>;
}
export function createQuickPickModel(
  entries: readonly QuickPickEntry[],
): QuickPickModel {
  const items: QuickPickRow[] = [];
  const roots: QuickPickRow[] = [];
  const children = new Map<string, QuickPickRow[]>();
  let group: QuickPickSeparator | undefined;
  entries.forEach((entry, index) => {
    if (entry.type === 'separator') {
      if (!entry.buttons) return;
      group = entry;
      children.set(entry.id, []);
      roots.push({
        entry,
        index,
        childIndex: 0,
        hidden: false,
        height: 30,
        top: 0,
      });
      return;
    }
    const previous = entries[index - 1];
    const row: QuickPickRow = {
      entry,
      index,
      childIndex: group ? children.get(group.id)!.length : index,
      group,
      separator:
        previous?.type === 'separator' && !previous.buttons
          ? previous
          : undefined,
      hidden: false,
      labelHighlights: entry.highlights?.label,
      descriptionHighlights: entry.highlights?.description,
      detailHighlights: entry.highlights?.detail,
      height: entry.detail ? 44 : 22,
      top: 0,
    };
    items.push(row);
    if (group) children.get(group.id)!.push(row);
    else roots.push(row);
  });
  return { items, roots, children };
}
export function filterQuickPick(
  model: QuickPickModel,
  entries: readonly QuickPickEntry[],
  value: string,
  options: QuickPickProps,
): { rows: QuickPickRow[]; didFilter: boolean } {
  const matchOnLabel = options.matchOnLabel !== false;
  const sortByLabel = options.sortByLabel !== false;
  const matchOnDescription = !!options.matchOnDescription;
  const matchOnDetail = !!options.matchOnDetail;
  const didFilter =
    sortByLabel || matchOnLabel || matchOnDescription || matchOnDetail;
  const query = value.trim();
  if (didFilter) {
    if (!query || !(matchOnLabel || matchOnDescription || matchOnDetail)) {
      for (const row of model.items) {
        row.labelHighlights = undefined;
        row.descriptionHighlights = undefined;
        row.detailHighlights = undefined;
        row.hidden = false;
        const previous = entries[row.index - 1];
        row.separator =
          previous?.type === 'separator' && !previous.buttons
            ? previous
            : undefined;
      }
    } else {
      let currentSeparator: QuickPickSeparator | undefined;
      for (const row of model.items) {
        const entry = row.entry as QuickPickItem;
        const labelHighlights = matchOnLabel
          ? ((options.matchOnLabelMode === 'contiguous'
              ? matchesContiguousIconAware(
                  value,
                  parseLabelWithIcons(entry.label),
                )
              : matchesFuzzyIconAware(
                  query,
                  parseLabelWithIcons(entry.label),
                )) ?? undefined)
          : undefined;
        const descriptionHighlights = matchOnDescription
          ? (matchesFuzzyIconAware(
              query,
              parseLabelWithIcons(entry.description || ''),
            ) ?? undefined)
          : undefined;
        const detailHighlights = matchOnDetail
          ? (matchesFuzzyIconAware(
              query,
              parseLabelWithIcons(entry.detail || ''),
            ) ?? undefined)
          : undefined;
        row.labelHighlights = labelHighlights;
        row.descriptionHighlights = descriptionHighlights;
        row.detailHighlights = detailHighlights;
        row.hidden = !(
          labelHighlights ||
          descriptionHighlights ||
          detailHighlights ||
          entry.alwaysShow
        );
        row.separator = undefined;
        if (!sortByLabel) {
          const previous = entries[row.index - 1];
          if (previous?.type === 'separator' && !previous.buttons)
            currentSeparator = previous;
          if (currentSeparator && !row.hidden) {
            row.separator = currentSeparator;
            currentSeparator = undefined;
          }
        }
      }
    }
  }
  const rows: QuickPickRow[] = [];
  if (sortByLabel && query) {
    rows.push(...model.items.filter((row) => !row.hidden));
    rows.sort((a, b) => {
      const aMatches = a.labelHighlights?.length || 0;
      const bMatches = b.labelHighlights?.length || 0;
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      if (!aMatches && !bMatches) return 0;
      return compareAnything(
        parseLabelWithIcons(a.entry.label || '').text.trim(),
        parseLabelWithIcons(b.entry.label || '').text.trim(),
        value.toLowerCase(),
      );
    });
  } else {
    for (const root of model.roots) {
      if (root.entry.type === 'separator') {
        const visible = model.children
          .get(root.entry.id)!
          .filter((row) => !row.hidden);
        if (visible.length) rows.push(root, ...visible);
      } else if (!root.hidden) rows.push(root);
    }
  }
  let top = 0;
  for (const row of rows) {
    row.top = top;
    top += row.height;
  }
  return { rows, didFilter };
}
export function rowAriaLabel(row: QuickPickRow) {
  const entry = row.entry;
  const label =
    entry.ariaLabel ||
    [
      entry.label,
      entry.description,
      entry.type !== 'separator' ? entry.detail : undefined,
    ]
      .map(getCodiconAriaLabel)
      .filter(Boolean)
      .join(', ');
  const separator = entry.type === 'separator' ? entry : row.separator;
  return separator?.label ? `${label}, ${separator.label}` : label;
}
