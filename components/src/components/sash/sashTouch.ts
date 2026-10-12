/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// Touch gesture dispatch for sash targets. Inertial scrolling is unnecessary after a sash's End.
const targets = new Set<HTMLElement>();
interface TouchData { target: EventTarget; time: number; startX: number; startY: number; x: number; y: number }
const touches = new Map<number, TouchData>();
function dispatch(type: string, touch: TouchData, position = false) {
  const event = new Event(type, { bubbles:false, cancelable:true });
  Object.assign(event, { initialTarget:touch.target, ...(position ? { pageX:touch.x, pageY:touch.y } : {}) });
  let dispatched = false;
  const ordered = [...targets].filter(target => touch.target instanceof Node && target.contains(touch.target)).map(target => {
    let depth = 0, node = touch.target as Node | null;
    while (node && node !== target) { depth++; node = node.parentElement; }
    return { target, depth };
  }).sort((a,b) => a.depth - b.depth);
  for (const { target } of ordered) { target.dispatchEvent(event); dispatched = true; }
  return dispatched;
}
function start(event: TouchEvent) {
  let dispatched = false;
  for (const touch of Array.from(event.targetTouches)) {
    const data = { target:touch.target, time:Date.now(), startX:touch.pageX, startY:touch.pageY, x:touch.pageX, y:touch.pageY };
    touches.set(touch.identifier, data); dispatched = dispatch('-monaco-gesturestart', data, true) || dispatched;
  }
  if (dispatched) { event.preventDefault(); event.stopPropagation(); }
}
function move(event: TouchEvent) {
  let dispatched = false;
  for (const touch of Array.from(event.changedTouches)) {
    const data = touches.get(touch.identifier); if (!data) continue;
    data.x = touch.pageX; data.y = touch.pageY; dispatched = dispatch('-monaco-gesturechange', data, true) || dispatched;
  }
  if (dispatched) { event.preventDefault(); event.stopPropagation(); }
}
function end(event: TouchEvent) {
  let dispatched = false;
  for (const touch of Array.from(event.changedTouches)) {
    const data = touches.get(touch.identifier); if (!data) continue;
    if (Date.now() - data.time < 700 && Math.abs(data.startX - data.x) < 30 && Math.abs(data.startY - data.y) < 30) dispatched = dispatch('-monaco-gesturetap', data, true) || dispatched;
    dispatched = dispatch('-monaco-gesturesend', data) || dispatched; touches.delete(touch.identifier);
  }
  if (dispatched) { event.preventDefault(); event.stopPropagation(); }
}
export function registerSashTouch(element: HTMLElement) {
  if (!('ontouchstart' in window) && navigator.maxTouchPoints === 0) return () => {};
  if (!targets.size) { document.addEventListener('touchstart', start, { passive:false }); document.addEventListener('touchmove', move, { passive:false }); document.addEventListener('touchend', end); }
  targets.add(element);
  return () => { targets.delete(element); if (!targets.size) { document.removeEventListener('touchstart', start); document.removeEventListener('touchmove', move); document.removeEventListener('touchend', end); touches.clear(); } };
}
