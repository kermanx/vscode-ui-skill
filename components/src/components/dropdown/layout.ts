/* Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. */
export interface Anchor {
  offset: number;
  size: number;
  before?: boolean;
  align?: boolean;
}
export function layout(
  viewportSize: number,
  viewSize: number,
  anchor: Anchor,
): number {
  const after = anchor.align ? anchor.offset : anchor.offset + anchor.size;
  const before = anchor.align ? anchor.offset + anchor.size : anchor.offset;
  if (anchor.before !== false) {
    if (viewSize <= viewportSize - after) return after;
    if (viewSize <= before) return before - viewSize;
    return Math.max(viewportSize - viewSize, 0);
  }
  if (viewSize <= before) return before - viewSize;
  if (viewSize <= viewportSize - after && before < viewSize / 2) return after;
  return 0;
}
export function positionDropdown(
  anchor: DOMRect,
  width: number,
  height: number,
  alignment: 'left' | 'right',
) {
  const top = layout(window.innerHeight, height, {
    offset: anchor.top,
    size: anchor.height,
  });
  const intersects = top < anchor.bottom && anchor.top < top + height;
  return {
    top: `${top}px`,
    left: `${layout(window.innerWidth, width, { offset: anchor.left, size: anchor.width, before: alignment === 'left', align: !intersects })}px`,
  };
}
export function positionSubmenu(
  entry: DOMRect,
  width: number,
  height: number,
  padding: number,
) {
  let top = entry.top - padding;
  let entryHeight = entry.height + 2 * padding;
  let left = layout(window.innerWidth, width, {
    offset: entry.left,
    size: entry.width,
  });
  if (left >= entry.left && left < entry.right) {
    if (entry.left + 10 + width <= window.innerWidth) left = entry.left + 10;
    top += 10;
    entryHeight = 0;
  }
  let menuTop = layout(window.innerHeight, height, { offset: top, size: 0 });
  if (
    menuTop + height === top &&
    menuTop + entryHeight + height <= window.innerHeight
  )
    menuTop += entryHeight;
  return { left: `${left}px`, top: `${menuTop}px` };
}
