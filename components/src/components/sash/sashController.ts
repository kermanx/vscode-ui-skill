/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import type {
  SashEvent,
  SashHandle,
  SashOrientation,
  SashState,
} from './types';
export const sashController = Symbol('Sash controller');
export interface SashPointerEvent extends Event {
  pageX: number;
  pageY: number;
  altKey?: boolean;
  initialTarget?: EventTarget;
  __orthogonalSashEvent?: boolean;
  __linkedSashEvent?: boolean;
}
interface Configuration {
  orientation: SashOrientation;
  state: SashState;
  linkedSash?: SashHandle;
  orthogonalStartSash?: SashHandle;
  orthogonalEndSash?: SashHandle;
}
interface Callbacks {
  active(value: boolean): void;
  hover(value: boolean): void;
  start(event: SashEvent): void;
  change(event: SashEvent): void;
  end(): void;
  reset(): void;
}
function resolve(handle?: SashHandle): SashController | undefined {
  return (
    handle as (SashHandle & { [sashController]: SashController }) | undefined
  )?.[sashController];
}
interface DragEntry {
  controller: SashController;
  style: HTMLStyleElement;
  startX: number;
  startY: number;
  altKey: boolean | undefined;
  multi: boolean;
}
class DragSession {
  private entries: DragEntry[] = [];
  disposed = false;
  get empty() {
    return this.entries.length === 0;
  }
  constructor(
    private source: EventTarget,
    private moveType: string,
    private endType: string,
  ) {
    source.addEventListener(moveType, this.move);
    source.addEventListener(endType, this.end);
  }
  add(entry: DragEntry) {
    this.entries.push(entry);
  }
  private move = (raw: Event) => {
    const event = raw as SashPointerEvent;
    for (const entry of this.entries) {
      event.preventDefault();
      entry.controller.change({
        startX: entry.startX,
        currentX: event.pageX,
        startY: entry.startY,
        currentY: event.pageY,
        altKey: entry.altKey,
      });
    }
  };
  private end = (event: Event) => {
    event.preventDefault();
    this.dispose(true);
  };
  updateCursor(controller: SashController) {
    for (const entry of this.entries)
      if (entry.controller === controller)
        entry.style.textContent = `* { cursor: ${controller.cursor(entry.multi)} !important; }`;
  }
  dispose(emitEnd = false) {
    if (this.disposed) return;
    this.disposed = true;
    this.source.removeEventListener(this.moveType, this.move);
    this.source.removeEventListener(this.endType, this.end);
    for (const entry of this.entries) {
      entry.style.remove();
      entry.controller.finish(this, emitEnd);
      for (const iframe of entry.controller
        .element()
        ?.ownerDocument.getElementsByTagName('iframe') ?? [])
        iframe.classList.remove('pointer-events-disabled');
    }
    this.entries = [];
  }
}
export class SashController {
  private hoverTimer: ReturnType<typeof setTimeout> | undefined;
  private sessions = new Set<DragSession>();
  private active = false;
  private disposed = false;
  constructor(
    public readonly element: () => HTMLElement | undefined,
    private config: () => Configuration,
    private callbacks: Callbacks,
  ) {}
  private orthogonal(event: SashPointerEvent) {
    const target = event.initialTarget ?? event.target;
    if (
      !(target instanceof HTMLElement) ||
      !target.classList.contains('orthogonal-drag-handle')
    )
      return;
    return resolve(
      target.classList.contains('start')
        ? this.config().orthogonalStartSash
        : this.config().orthogonalEndSash,
    );
  }
  begin(event: SashPointerEvent, kind: 'mouse' | 'gesture') {
    const element = this.element();
    if (!element) return;
    const session =
      kind === 'mouse'
        ? new DragSession(
            element.ownerDocument.defaultView!,
            'mousemove',
            'mouseup',
          )
        : new DragSession(
            element,
            '-monaco-gesturechange',
            '-monaco-gesturesend',
          );
    this.start(event, session);
    if (session.empty) session.dispose();
  }
  private start(event: SashPointerEvent, session: DragSession) {
    event.preventDefault();
    let multi = false;
    if (!event.__orthogonalSashEvent) {
      const orthogonal = this.orthogonal(event);
      if (orthogonal) {
        multi = true;
        event.__orthogonalSashEvent = true;
        orthogonal.start(event, session);
      }
    }
    const linked = resolve(this.config().linkedSash);
    if (linked && !event.__linkedSashEvent) {
      event.__linkedSashEvent = true;
      linked.start(event, session);
    }
    if (this.config().state === 'disabled' || this.disposed || session.disposed)
      return;
    const element = this.element();
    if (!element) return;
    for (const iframe of element.ownerDocument.getElementsByTagName('iframe'))
      iframe.classList.add('pointer-events-disabled');
    const startX = event.pageX,
      startY = event.pageY,
      altKey = event.altKey;
    this.active = true;
    element.classList.add('active');
    this.callbacks.active(true);
    const style = element.ownerDocument.createElement('style');
    style.type = 'text/css';
    style.media = 'screen';
    this.sessions.add(session);
    session.add({ controller: this, style, startX, startY, altKey, multi });
    this.callbacks.start({
      startX,
      currentX: startX,
      startY,
      currentY: startY,
      altKey,
    });
    if (this.disposed || session.disposed) return;
    element.append(style);
    style.textContent = `* { cursor: ${this.cursor(multi)} !important; }`;
  }
  cursor(multi: boolean) {
    if (multi) return 'all-scroll';
    const { orientation, state } = this.config();
    if (orientation === 'horizontal')
      return state === 'minimum'
        ? 's-resize'
        : state === 'maximum'
          ? 'n-resize'
          : navigator.platform.includes('Mac')
            ? 'row-resize'
            : 'ns-resize';
    return state === 'minimum'
      ? 'e-resize'
      : state === 'maximum'
        ? 'w-resize'
        : navigator.platform.includes('Mac')
          ? 'col-resize'
          : 'ew-resize';
  }
  stateChanged() {
    for (const session of this.sessions) session.updateCursor(this);
  }
  change(event: SashEvent) {
    this.callbacks.change(event);
  }
  finish(session: DragSession, emit: boolean) {
    this.sessions.delete(session);
    this.active = false;
    this.element()?.classList.remove('active');
    this.callbacks.active(false);
    if (emit) this.callbacks.end();
  }
  reset(event: SashPointerEvent) {
    this.orthogonal(event)?.callbacks.reset();
    resolve(this.config().linkedSash)?.callbacks.reset();
    this.callbacks.reset();
  }
  enter(fromLinked = false) {
    clearTimeout(this.hoverTimer);
    const hover = () => {
      this.element()?.classList.add('hover');
      this.callbacks.hover(true);
    };
    if (this.active) hover();
    else this.hoverTimer = setTimeout(hover, 300);
    if (!fromLinked) resolve(this.config().linkedSash)?.enter(true);
  }
  leave(fromLinked = false) {
    clearTimeout(this.hoverTimer);
    this.element()?.classList.remove('hover');
    this.callbacks.hover(false);
    if (!fromLinked) resolve(this.config().linkedSash)?.leave(true);
  }
  enterOrthogonal(start: boolean) {
    resolve(
      start
        ? this.config().orthogonalStartSash
        : this.config().orthogonalEndSash,
    )?.enter();
  }
  leaveOrthogonal(start: boolean) {
    resolve(
      start
        ? this.config().orthogonalStartSash
        : this.config().orthogonalEndSash,
    )?.leave();
  }
  dispose() {
    this.disposed = true;
    clearTimeout(this.hoverTimer);
    for (const session of [...this.sessions]) session.dispose();
  }
}
