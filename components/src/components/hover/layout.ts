/* Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. */
import { layout as contextLayout } from '../dropdown/layout';
import type { HoverPosition, HoverTarget } from './types';
export interface HoverLayoutOptions {
  position: HoverPosition;
  alignment: 'left' | 'right';
  showPointer: boolean;
  forcePosition: boolean;
  maxHeightRatio: number;
}
/** Layout a hover and its pointer against a point anchor. */
export function layoutHover(
  root: HTMLElement,
  contents: HTMLElement,
  host: HTMLElement,
  pointer: HTMLElement | undefined,
  target: HoverTarget,
  options: HoverLayoutOptions,
) {
  root.classList.remove('right-aligned');
  contents.style.maxHeight = '';
  root.style.maxWidth = '';
  let position = options.position;
  const bounds = target.targetElements[0].getBoundingClientRect();
  const rect = {
    left: bounds.left,
    right: bounds.right,
    top: bounds.top,
    bottom: bounds.bottom,
  };
  const doc = root.ownerDocument.documentElement,
    win = root.ownerDocument.defaultView!;
  const pointerSize = pointer ? 3 : 0;
  if (target.x === undefined) {
    if (
      options.alignment === 'right' &&
      (position === 'above' || position === 'below')
    ) {
      const available = rect.right - doc.clientLeft - 4;
      if (root.clientWidth > available)
        root.style.maxWidth = `${Math.max(available, 0)}px`;
    } else if (options.forcePosition) {
      if (position === 'right')
        root.style.maxWidth = `${doc.clientWidth - rect.right - pointerSize - 2}px`;
      else if (position === 'left')
        root.style.maxWidth = `${rect.left - pointerSize - 2}px`;
    } else if (position === 'right') {
      if (doc.clientWidth - rect.right < root.clientWidth + pointerSize)
        position =
          rect.left >= root.clientWidth + pointerSize ? 'left' : 'below';
    } else if (position === 'left') {
      if (rect.left < root.clientWidth + pointerSize)
        position =
          doc.clientWidth - rect.right >= root.clientWidth + pointerSize
            ? 'right'
            : 'below';
      if (rect.left - root.clientWidth - pointerSize <= doc.clientLeft)
        position = 'right';
    }
  }
  if (target.y === undefined && !options.forcePosition) {
    if (position === 'above' && rect.top - root.clientHeight - pointerSize < 0)
      position = 'below';
    else if (
      position === 'below' &&
      rect.bottom + root.offsetHeight + pointerSize > win.innerHeight
    )
      position = 'above';
  }
  let maxHeight = win.innerHeight * options.maxHeightRatio;
  if (options.forcePosition) {
    if (position === 'above')
      maxHeight = Math.min(maxHeight, rect.top - pointerSize - 2);
    else if (position === 'below')
      maxHeight = Math.min(
        maxHeight,
        win.innerHeight - rect.bottom - pointerSize - 2,
      );
  }
  root.style.maxHeight = '';
  const outside = root.offsetHeight - contents.offsetHeight;
  root.style.maxHeight = `${maxHeight}px`;
  contents.style.maxHeight = `${Math.max(0, maxHeight - outside)}px`;
  if (contents.clientHeight < contents.scrollHeight)
    contents.style.paddingRight = '10px';
  host.style.padding = '';
  host.style.margin = '';
  if (pointer) {
    const edge =
      position === 'right'
        ? 'Left'
        : position === 'left'
          ? 'Right'
          : position === 'above'
            ? 'Bottom'
            : 'Top';
    host.style.setProperty(`padding-${edge.toLowerCase()}`, '3px');
    host.style.setProperty(`margin-${edge.toLowerCase()}`, '-3px');
    if (position === 'right') {
      rect.left += 3;
      rect.right += 3;
    } else if (position === 'left') {
      rect.left -= 3;
      rect.right -= 3;
    } else if (position === 'above') {
      rect.top -= 3;
      rect.bottom -= 3;
    } else {
      rect.top += 3;
      rect.bottom += 3;
    }
  }
  const centerX = rect.left + bounds.width / 2,
    centerY = rect.top + bounds.height / 2;
  const width = root.clientWidth + 2;
  let x: number;
  if (target.x !== undefined) x = target.x;
  else if (position === 'right') x = rect.right;
  else if (position === 'left') x = rect.left - width;
  else {
    x =
      options.alignment === 'right'
        ? rect.right - width
        : pointer
          ? centerX - root.clientWidth / 2
          : rect.left;
    if (x + width >= doc.clientWidth) {
      root.classList.add('right-aligned');
      x = Math.max(doc.clientWidth - width - 2, doc.clientLeft);
    }
  }
  if (x < doc.clientLeft) x = rect.left + 2;
  let y =
    target.y ??
    (position === 'above'
      ? rect.top
      : position === 'below'
        ? rect.bottom - 2
        : pointer
          ? centerY + root.clientHeight / 2
          : rect.bottom);
  if (y > win.innerHeight) y = rect.bottom;
  if (pointer) {
    pointer.className = `workbench-hover-pointer ${position === 'left' ? 'right' : position === 'right' ? 'left' : position === 'above' ? 'bottom' : 'top'}`;
    pointer.style.top = '';
    pointer.style.left = '';
    if (position === 'left' || position === 'right')
      pointer.style.top = `${root.clientHeight > bounds.height ? centerY - (y - root.clientHeight) - 3 : root.clientHeight / 2 - 3}px`;
    else {
      let left = root.clientWidth / 2 - 3;
      if (x + left < rect.left || x + left > rect.right) left = centerX - x - 3;
      pointer.style.left = `${left}px`;
    }
  }
  // ContextView's point anchor has width 1 and height 2. Host padding is included in its dimensions.
  const viewHeight = host.parentElement!.offsetHeight;
  const top = contextLayout(win.innerHeight, viewHeight, {
    offset: y,
    size: 2,
    before: position === 'below',
  });
  const intersects = top < y + 2 && y < top + viewHeight;
  return {
    left: contextLayout(win.innerWidth, host.parentElement!.offsetWidth, {
      offset: x,
      size: 1,
      align: !intersects,
    }),
    top,
  };
}
