// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
import type { CompositeItem } from './types';
export function visibleBadges(item: CompositeItem) {
  const badges = item.badges || [];
  for (const type of ['progress', 'icon', 'number'] as const) {
    const matching = badges.filter((badge) => badge.type === type);
    if (matching.length) return { badges: matching, type };
  }
  return { badges: [], type: undefined };
}
export function badgeText(item: CompositeItem) {
  const { badges, type } = visibleBadges(item);
  if (type !== 'number') return '';
  const number = badges.reduce(
    (sum, badge) => sum + (badge.type === 'number' ? badge.value : 0),
    0,
  );
  if (number <= 0) return '';
  if (number <= 999) return String(number);
  const thousands = number / 1000;
  return `${Math.floor(thousands)}K${thousands > Math.floor(thousands) ? '+' : ''}`;
}
export function title(item: CompositeItem) {
  let result = item.keybinding
    ? `${item.label} (${item.keybinding})`
    : item.label;
  for (const badge of visibleBadges(item).badges)
    if (badge.description) result += ` - ${badge.description}`;
  return result;
}
/** The native switcher makes room for its active item before reserving overflow. */
export function fitItems(
  items: readonly CompositeItem[],
  activeId: string | undefined,
  sizes: ReadonlyMap<string, number>,
  limit: number,
  overflowSize: number,
) {
  const all = items.filter(
    (item) =>
      item.visible !== false && (item.pinned !== false || item.id === activeId),
  );
  let shown = [...all],
    size = 0,
    count = shown.length;
  for (let index = 0; index < shown.length; index++) {
    const itemSize = sizes.get(shown[index]!.id) || 0;
    if (size + itemSize > limit) {
      count = index;
      break;
    }
    size += itemSize;
  }
  shown = shown.slice(0, count);
  const active = items.find((item) => item.id === activeId);
  if (active && !shown.includes(active)) {
    size += sizes.get(active.id) || 0;
    shown.push(active);
  }
  while (size > limit && shown.length) {
    const removed =
      shown.length > 1 ? shown.splice(shown.length - 2, 1)[0] : shown.pop();
    size -= sizes.get(removed!.id) || 0;
  }
  if (all.length > shown.length) size += overflowSize;
  while (size > limit && shown.length) {
    const removed =
      shown.length > 1 && shown.at(-1)?.id === activeId
        ? shown.splice(shown.length - 2, 1)[0]
        : shown.pop();
    size -= sizes.get(removed!.id) || 0;
  }
  return { shown, overflow: all.filter((item) => !shown.includes(item)) };
}
