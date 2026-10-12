// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
interface Entry {
  host: () => HTMLElement | undefined;
  locked: () => boolean;
  hide: () => void;
  track: (inside: boolean, child: object) => void;
}
const stacks = new WeakMap<Document, Entry[]>();
/** A document owns one top-level hover; content can open at most two nested levels. */
export interface HoverRegistration { depth: number; release: () => void; contains: (node: Node) => boolean; isTop: () => boolean }
export function claimHover(document: Document, target: HTMLElement, entry: Entry): HoverRegistration | undefined {
  const stack = stacks.get(document) || [];
  stacks.set(document, stack);
  let parent = -1;
  for (let i = stack.length - 1; i >= 0; i--) if (stack[i]!.host()?.contains(target)) { parent = i; break; }
  if (parent < 0 && stack.at(-1)?.locked()) return;
  if (parent >= 0 && stack.length >= 3) return;
  const replaced = stack.splice(parent + 1);
  for (const item of replaced.reverse()) item.hide();
  stack.push(entry);
  const parents = stack.slice(0, -1);
  const enter = () => parents.forEach(item => item.track(true, entry));
  const leave = () => parents.forEach(item => item.track(false, entry));
  // The host is available on the following render, before pointer events can reach it.
  queueMicrotask(() => { entry.host()?.addEventListener('mouseover', enter); entry.host()?.addEventListener('mouseleave', leave); });
  const release = () => {
    leave();
    entry.host()?.removeEventListener('mouseover', enter); entry.host()?.removeEventListener('mouseleave', leave);
    const index = stack.indexOf(entry);
    if (index >= 0) { const children = stack.splice(index); for (const item of children.slice(1).reverse()) item.hide(); }
  };
  return { depth: stack.length - 1, release, contains: node => stack.slice(stack.indexOf(entry)).some(item => item.host()?.contains(node)), isTop: () => stack.at(-1) === entry };
}
