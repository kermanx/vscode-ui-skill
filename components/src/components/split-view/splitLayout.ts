/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import type { SplitViewItem } from './types';
import type { SashState } from '../sash/types';
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
function range(from: number, to?: number) {
  if (to === undefined) {
    to = from;
    from = 0;
  }
  const values: number[] = [];
  if (from < to) for (let i = from; i < to; i++) values.push(i);
  else for (let i = from; i > to; i--) values.push(i);
  return values;
}
function pushToStart(values: number[], value: number) {
  const i = values.indexOf(value);
  if (i >= 0) {
    values.splice(i, 1);
    values.unshift(value);
  }
}
function pushToEnd(values: number[], value: number) {
  const i = values.indexOf(value);
  if (i >= 0) {
    values.splice(i, 1);
    values.push(value);
  }
}
const LayoutPriority = { Low: 'low', High: 'high' };
const SashState = {
  AtMinimum: 'minimum',
  AtMaximum: 'maximum',
  Disabled: 'disabled',
  Enabled: 'enabled',
} as const;
enum State {
  Idle,
  Busy,
}
interface ISashDragSnapState {
  index: number;
  limitDelta: number;
  size: number;
}
interface ISashDragState {
  index: number;
  start: number;
  current: number;
  sizes: number[];
  minDelta: number;
  maxDelta: number;
  alt: boolean;
  snapBefore: ISashDragSnapState | undefined;
  snapAfter: ISashDragSnapState | undefined;
  disposable: { dispose(): void };
}
export class ViewItem {
  size: number;
  cachedVisibleSize: number | undefined;
  enabled = true;
  constructor(
    public view: SplitViewItem,
    size: number,
  ) {
    this.size = view.visible === false ? 0 : size;
    this.cachedVisibleSize = view.visible === false ? size : undefined;
  }
  get visible() {
    return this.cachedVisibleSize === undefined;
  }
  get minimumSize() {
    return this.visible ? this.viewMinimumSize : 0;
  }
  get maximumSize() {
    return this.visible ? this.viewMaximumSize : 0;
  }
  get viewMinimumSize() {
    return this.view.minimumSize ?? 0;
  }
  get viewMaximumSize() {
    return this.view.maximumSize ?? Infinity;
  }
  get priority() {
    return this.view.priority;
  }
  get proportionalLayout() {
    return this.view.proportionalLayout ?? true;
  }
  get snap() {
    return !!this.view.snap;
  }
  setVisible(visible: boolean, size?: number) {
    if (visible === this.visible) return;
    if (visible) {
      this.size = clamp(
        this.cachedVisibleSize!,
        this.viewMinimumSize,
        this.viewMaximumSize,
      );
      this.cachedVisibleSize = undefined;
    } else {
      this.cachedVisibleSize = typeof size === 'number' ? size : this.size;
      this.size = 0;
    }
  }
}
export class SplitLayout {
  size = 0;
  _contentSize = 0;
  proportions: (number | undefined)[] | undefined;
  viewItems: ViewItem[] = [];
  sashItems: { sash: { state: SashState } }[] = [];
  sashDragState: ISashDragState | undefined;
  state = State.Idle;
  startSnappingEnabled = true;
  endSnappingEnabled = true;
  constructor(
    public proportionalLayout: boolean,
    public inverseAltBehavior: boolean,
    private changed: () => void,
    private sashChanged: (index: number) => void,
  ) {}
  initialize(
    views: readonly SplitViewItem[],
    sizes: readonly number[],
    size: number,
  ) {
    this.size = size;
    this.viewItems = views.map(
      (view, index) =>
        new ViewItem(view, sizes[index] ?? view.size ?? view.minimumSize ?? 0),
    );
    this.syncSashes();
    this._contentSize = this.viewItems.reduce(
      (sum, item) => sum + item.size,
      0,
    );
    this.saveProportions();
    this.layout(size);
  }
  syncSashes() {
    this.sashItems = Array.from(
      { length: Math.max(0, this.viewItems.length - 1) },
      (_, i) => this.sashItems[i] ?? { sash: { state: 'enabled' } },
    );
  }
  addView(view: SplitViewItem, size: number, index: number) {
    this.viewItems.splice(index, 0, new ViewItem(view, size));
    this.syncSashes();
    this.relayout([index]);
  }
  removeView(index: number) {
    this.viewItems.splice(index, 1);
    this.syncSashes();
    this.relayout();
  }
  moveView(from: number, to: number) {
    const item = this.viewItems[from];
    const size = item.size;
    const cached = item.cachedVisibleSize;
    this.removeView(from);
    this.addView(
      { ...item.view, visible: cached === undefined },
      cached ?? size,
      to,
    );
    this.viewItems[to].view = item.view;
  }
  get length() {
    return this.viewItems.length;
  }
  get minimumSize() {
    return this.viewItems.reduce((r, item) => r + item.minimumSize, 0);
  }
  get maximumSize() {
    return this.length === 0
      ? Infinity
      : this.viewItems.reduce((r, item) => r + item.maximumSize, 0);
  }
  get contentSize() {
    return this._contentSize;
  }
  dispose() {
    this.sashDragState?.disposable.dispose();
  }
  resetAllowed(index: number) {
    const before = this.findFirstSnapIndex(range(index, -1));
    const after = this.findFirstSnapIndex(range(index + 1, this.length));
    return (
      !(before !== undefined && !this.viewItems[before].visible) &&
      !(after !== undefined && !this.viewItems[after].visible)
    );
  }

  setViewVisible(index: number, visible: boolean): void {
    if (index < 0 || index >= this.viewItems.length) {
      throw new Error('Index out of bounds');
    }

    const viewItem = this.viewItems[index];
    viewItem.setVisible(visible);

    this.distributeEmptySpace(index);
    this.layoutViews();
    this.saveProportions();
  }

  getViewCachedVisibleSize(index: number): number | undefined {
    if (index < 0 || index >= this.viewItems.length) {
      throw new Error('Index out of bounds');
    }

    const viewItem = this.viewItems[index];
    return viewItem.cachedVisibleSize;
  }

  layout(size: number): void {
    const previousSize = Math.max(this.size, this._contentSize);
    this.size = size;

    if (!this.proportions) {
      const indexes = range(this.viewItems.length);
      const lowPriorityIndexes = indexes.filter(
        (i) => this.viewItems[i].priority === LayoutPriority.Low,
      );
      const highPriorityIndexes = indexes.filter(
        (i) => this.viewItems[i].priority === LayoutPriority.High,
      );

      this.resize(
        this.viewItems.length - 1,
        size - previousSize,
        undefined,
        lowPriorityIndexes,
        highPriorityIndexes,
      );
    } else {
      let total = 0;

      for (let i = 0; i < this.viewItems.length; i++) {
        const item = this.viewItems[i];
        const proportion = this.proportions[i];

        if (typeof proportion === 'number') {
          total += proportion;
        } else {
          size -= item.size;
        }
      }

      for (let i = 0; i < this.viewItems.length; i++) {
        const item = this.viewItems[i];
        const proportion = this.proportions[i];

        if (typeof proportion === 'number' && total > 0) {
          item.size = clamp(
            Math.round((proportion * size) / total),
            item.minimumSize,
            item.maximumSize,
          );
        }
      }
    }

    this.distributeEmptySpace();
    this.layoutViews();
  }

  private saveProportions(): void {
    if (this.proportionalLayout && this._contentSize > 0) {
      this.proportions = this.viewItems.map((v) =>
        v.proportionalLayout && v.visible
          ? v.size / this._contentSize
          : undefined,
      );
    }
  }

  onSashStart(index: number, start: number, alt: boolean): void {
    for (const item of this.viewItems) {
      item.enabled = false;
    }

    // This way, we can press Alt while we resize a sash, macOS style!
    const keydown = (e: KeyboardEvent) =>
      resetSashDragState(this.sashDragState!.current, e.altKey);
    const keyup = () => resetSashDragState(this.sashDragState!.current, false);
    document.body.addEventListener('keydown', keydown);
    document.body.addEventListener('keyup', keyup);
    const disposable = {
      dispose() {
        document.body.removeEventListener('keydown', keydown);
        document.body.removeEventListener('keyup', keyup);
      },
    };

    const resetSashDragState = (start: number, alt: boolean) => {
      const sizes = this.viewItems.map((i) => i.size);
      let minDelta = Number.NEGATIVE_INFINITY;
      let maxDelta = Number.POSITIVE_INFINITY;

      if (this.inverseAltBehavior) {
        alt = !alt;
      }

      if (alt) {
        // When we're using the last sash with Alt, we're resizing
        // the view to the left/up, instead of right/down as usual
        // Thus, we must do the inverse of the usual
        const isLastSash = index === this.sashItems.length - 1;

        if (isLastSash) {
          const viewItem = this.viewItems[index];
          minDelta = (viewItem.minimumSize - viewItem.size) / 2;
          maxDelta = (viewItem.maximumSize - viewItem.size) / 2;
        } else {
          const viewItem = this.viewItems[index + 1];
          minDelta = (viewItem.size - viewItem.maximumSize) / 2;
          maxDelta = (viewItem.size - viewItem.minimumSize) / 2;
        }
      }

      let snapBefore: ISashDragSnapState | undefined;
      let snapAfter: ISashDragSnapState | undefined;

      if (!alt) {
        const upIndexes = range(index, -1);
        const downIndexes = range(index + 1, this.viewItems.length);
        const minDeltaUp = upIndexes.reduce(
          (r, i) => r + (this.viewItems[i].minimumSize - sizes[i]),
          0,
        );
        const maxDeltaUp = upIndexes.reduce(
          (r, i) => r + (this.viewItems[i].viewMaximumSize - sizes[i]),
          0,
        );
        const maxDeltaDown =
          downIndexes.length === 0
            ? Number.POSITIVE_INFINITY
            : downIndexes.reduce(
                (r, i) => r + (sizes[i] - this.viewItems[i].minimumSize),
                0,
              );
        const minDeltaDown =
          downIndexes.length === 0
            ? Number.NEGATIVE_INFINITY
            : downIndexes.reduce(
                (r, i) => r + (sizes[i] - this.viewItems[i].viewMaximumSize),
                0,
              );
        const minDelta = Math.max(minDeltaUp, minDeltaDown);
        const maxDelta = Math.min(maxDeltaDown, maxDeltaUp);
        const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
        const snapAfterIndex = this.findFirstSnapIndex(downIndexes);

        if (typeof snapBeforeIndex === 'number') {
          const viewItem = this.viewItems[snapBeforeIndex];
          const halfSize = Math.floor(viewItem.viewMinimumSize / 2);

          snapBefore = {
            index: snapBeforeIndex,
            limitDelta: viewItem.visible
              ? minDelta - halfSize
              : minDelta + halfSize,
            size: viewItem.size,
          };
        }

        if (typeof snapAfterIndex === 'number') {
          const viewItem = this.viewItems[snapAfterIndex];
          const halfSize = Math.floor(viewItem.viewMinimumSize / 2);

          snapAfter = {
            index: snapAfterIndex,
            limitDelta: viewItem.visible
              ? maxDelta + halfSize
              : maxDelta - halfSize,
            size: viewItem.size,
          };
        }
      }

      this.sashDragState = {
        start,
        current: start,
        index,
        sizes,
        minDelta,
        maxDelta,
        alt,
        snapBefore,
        snapAfter,
        disposable,
      };
    };

    resetSashDragState(start, alt);
  }

  onSashChange(current: number): void {
    const {
      index,
      start,
      sizes,
      alt,
      minDelta,
      maxDelta,
      snapBefore,
      snapAfter,
    } = this.sashDragState!;
    this.sashDragState!.current = current;

    const delta = current - start;
    const newDelta = this.resize(
      index,
      delta,
      sizes,
      undefined,
      undefined,
      minDelta,
      maxDelta,
      snapBefore,
      snapAfter,
    );

    if (alt) {
      const isLastSash = index === this.sashItems.length - 1;
      const newSizes = this.viewItems.map((i) => i.size);
      const viewItemIndex = isLastSash ? index : index + 1;
      const viewItem = this.viewItems[viewItemIndex];
      const newMinDelta = viewItem.size - viewItem.maximumSize;
      const newMaxDelta = viewItem.size - viewItem.minimumSize;
      const resizeIndex = isLastSash ? index - 1 : index + 1;

      this.resize(
        resizeIndex,
        -newDelta,
        newSizes,
        undefined,
        undefined,
        newMinDelta,
        newMaxDelta,
      );
    }

    this.distributeEmptySpace();
    this.layoutViews();
  }

  onSashEnd(index: number): void {
    this.sashChanged(index);
    this.sashDragState!.disposable.dispose();
    this.saveProportions();

    for (const item of this.viewItems) {
      item.enabled = true;
    }
  }

  onViewChange(item: ViewItem, size: number | undefined): void {
    const index = this.viewItems.indexOf(item);

    if (index < 0 || index >= this.viewItems.length) {
      return;
    }

    size = typeof size === 'number' ? size : item.size;
    size = clamp(size, item.minimumSize, item.maximumSize);

    if (this.inverseAltBehavior && index > 0) {
      // In this case, we want the view to grow or shrink both sides equally
      // so we just resize the "left" side by half and let `resize` do the clamping magic
      this.resize(index - 1, Math.floor((item.size - size) / 2));
      this.distributeEmptySpace();
      this.layoutViews();
    } else {
      item.size = size;

      // Absorb the change by layout priority, like `resizeView` does, so a neighbour with a size of its own is not squeezed (see #334167)
      const indexes = range(this.viewItems.length).filter((i) => i !== index);
      const lowPriorityIndexes = [
        ...indexes.filter(
          (i) => this.viewItems[i].priority === LayoutPriority.Low,
        ),
        index,
      ];
      const highPriorityIndexes = indexes.filter(
        (i) => this.viewItems[i].priority === LayoutPriority.High,
      );

      this.relayout(lowPriorityIndexes, highPriorityIndexes);
    }
  }

  resizeView(index: number, size: number): void {
    if (index < 0 || index >= this.viewItems.length) {
      return;
    }

    if (this.state !== State.Idle) {
      throw new Error('Cant modify splitview');
    }

    this.state = State.Busy;

    try {
      const indexes = range(this.viewItems.length).filter((i) => i !== index);
      const lowPriorityIndexes = [
        ...indexes.filter(
          (i) => this.viewItems[i].priority === LayoutPriority.Low,
        ),
        index,
      ];
      const highPriorityIndexes = indexes.filter(
        (i) => this.viewItems[i].priority === LayoutPriority.High,
      );

      const item = this.viewItems[index];
      size = Math.round(size);
      size = clamp(
        size,
        item.minimumSize,
        Math.min(item.maximumSize, this.size),
      );

      item.size = size;
      this.relayout(lowPriorityIndexes, highPriorityIndexes);
    } finally {
      this.state = State.Idle;
    }
  }

  isViewExpanded(index: number): boolean {
    if (index < 0 || index >= this.viewItems.length) {
      return false;
    }

    for (const item of this.viewItems) {
      if (item !== this.viewItems[index] && item.size > item.minimumSize) {
        return false;
      }
    }

    return true;
  }

  distributeViewSizes(): void {
    const flexibleViewItems: ViewItem[] = [];
    let flexibleSize = 0;

    for (const item of this.viewItems) {
      if (item.maximumSize - item.minimumSize > 0) {
        flexibleViewItems.push(item);
        flexibleSize += item.size;
      }
    }

    const size = Math.floor(flexibleSize / flexibleViewItems.length);

    for (const item of flexibleViewItems) {
      item.size = clamp(size, item.minimumSize, item.maximumSize);
    }

    const indexes = range(this.viewItems.length);
    const lowPriorityIndexes = indexes.filter(
      (i) => this.viewItems[i].priority === LayoutPriority.Low,
    );
    const highPriorityIndexes = indexes.filter(
      (i) => this.viewItems[i].priority === LayoutPriority.High,
    );

    this.relayout(lowPriorityIndexes, highPriorityIndexes);
  }

  getViewSize(index: number): number {
    if (index < 0 || index >= this.viewItems.length) {
      return -1;
    }

    return this.viewItems[index].size;
  }

  private relayout(
    lowPriorityIndexes?: number[],
    highPriorityIndexes?: number[],
  ): void {
    const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);

    this.resize(
      this.viewItems.length - 1,
      this.size - contentSize,
      undefined,
      lowPriorityIndexes,
      highPriorityIndexes,
    );
    this.distributeEmptySpace();
    this.layoutViews();
    this.saveProportions();
  }

  private resize(
    index: number,
    delta: number,
    sizes = this.viewItems.map((i) => i.size),
    lowPriorityIndexes?: number[],
    highPriorityIndexes?: number[],
    overloadMinDelta: number = Number.NEGATIVE_INFINITY,
    overloadMaxDelta: number = Number.POSITIVE_INFINITY,
    snapBefore?: ISashDragSnapState,
    snapAfter?: ISashDragSnapState,
  ): number {
    if (index < 0 || index >= this.viewItems.length) {
      return 0;
    }

    const upIndexes = range(index, -1);
    const downIndexes = range(index + 1, this.viewItems.length);

    if (highPriorityIndexes) {
      for (const index of highPriorityIndexes) {
        pushToStart(upIndexes, index);
        pushToStart(downIndexes, index);
      }
    }

    if (lowPriorityIndexes) {
      for (const index of lowPriorityIndexes) {
        pushToEnd(upIndexes, index);
        pushToEnd(downIndexes, index);
      }
    }

    const upItems = upIndexes.map((i) => this.viewItems[i]);
    const upSizes = upIndexes.map((i) => sizes[i]);

    const downItems = downIndexes.map((i) => this.viewItems[i]);
    const downSizes = downIndexes.map((i) => sizes[i]);

    const minDeltaUp = upIndexes.reduce(
      (r, i) => r + (this.viewItems[i].minimumSize - sizes[i]),
      0,
    );
    const maxDeltaUp = upIndexes.reduce(
      (r, i) => r + (this.viewItems[i].maximumSize - sizes[i]),
      0,
    );
    const maxDeltaDown =
      downIndexes.length === 0
        ? Number.POSITIVE_INFINITY
        : downIndexes.reduce(
            (r, i) => r + (sizes[i] - this.viewItems[i].minimumSize),
            0,
          );
    const minDeltaDown =
      downIndexes.length === 0
        ? Number.NEGATIVE_INFINITY
        : downIndexes.reduce(
            (r, i) => r + (sizes[i] - this.viewItems[i].maximumSize),
            0,
          );
    const minDelta = Math.max(minDeltaUp, minDeltaDown, overloadMinDelta);
    const maxDelta = Math.min(maxDeltaDown, maxDeltaUp, overloadMaxDelta);

    let snapped = false;

    if (snapBefore) {
      const snapView = this.viewItems[snapBefore.index];
      const visible = delta >= snapBefore.limitDelta;
      snapped = visible !== snapView.visible;
      snapView.setVisible(visible, snapBefore.size);
    }

    if (!snapped && snapAfter) {
      const snapView = this.viewItems[snapAfter.index];
      const visible = delta < snapAfter.limitDelta;
      snapped = visible !== snapView.visible;
      snapView.setVisible(visible, snapAfter.size);
    }

    if (snapped) {
      return this.resize(
        index,
        delta,
        sizes,
        lowPriorityIndexes,
        highPriorityIndexes,
        overloadMinDelta,
        overloadMaxDelta,
      );
    }

    delta = clamp(delta, minDelta, maxDelta);

    for (let i = 0, deltaUp = delta; i < upItems.length; i++) {
      const item = upItems[i];
      const size = clamp(
        upSizes[i] + deltaUp,
        item.minimumSize,
        item.maximumSize,
      );
      const viewDelta = size - upSizes[i];

      deltaUp -= viewDelta;
      item.size = size;
    }

    for (let i = 0, deltaDown = delta; i < downItems.length; i++) {
      const item = downItems[i];
      const size = clamp(
        downSizes[i] - deltaDown,
        item.minimumSize,
        item.maximumSize,
      );
      const viewDelta = size - downSizes[i];

      deltaDown += viewDelta;
      item.size = size;
    }

    return delta;
  }

  private distributeEmptySpace(lowPriorityIndex?: number): void {
    const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
    let emptyDelta = this.size - contentSize;

    const indexes = range(this.viewItems.length - 1, -1);
    const lowPriorityIndexes = indexes.filter(
      (i) => this.viewItems[i].priority === LayoutPriority.Low,
    );
    const highPriorityIndexes = indexes.filter(
      (i) => this.viewItems[i].priority === LayoutPriority.High,
    );

    for (const index of highPriorityIndexes) {
      pushToStart(indexes, index);
    }

    for (const index of lowPriorityIndexes) {
      pushToEnd(indexes, index);
    }

    if (typeof lowPriorityIndex === 'number') {
      pushToEnd(indexes, lowPriorityIndex);
    }

    for (let i = 0; emptyDelta !== 0 && i < indexes.length; i++) {
      const item = this.viewItems[indexes[i]];
      const size = clamp(
        item.size + emptyDelta,
        item.minimumSize,
        item.maximumSize,
      );
      const viewDelta = size - item.size;

      emptyDelta -= viewDelta;
      item.size = size;
    }
  }

  updateSashEnablement(): void {
    let previous = false;
    const collapsesDown = this.viewItems.map(
      (i) => (previous = i.size - i.minimumSize > 0 || previous),
    );

    previous = false;
    const expandsDown = this.viewItems.map(
      (i) => (previous = i.maximumSize - i.size > 0 || previous),
    );

    const reverseViews = [...this.viewItems].reverse();
    previous = false;
    const collapsesUp = reverseViews
      .map((i) => (previous = i.size - i.minimumSize > 0 || previous))
      .reverse();

    previous = false;
    const expandsUp = reverseViews
      .map((i) => (previous = i.maximumSize - i.size > 0 || previous))
      .reverse();

    let position = 0;
    for (let index = 0; index < this.sashItems.length; index++) {
      const { sash } = this.sashItems[index];
      const viewItem = this.viewItems[index];
      position += viewItem.size;

      const min = !(collapsesDown[index] && expandsUp[index + 1]);
      const max = !(expandsDown[index] && collapsesUp[index + 1]);

      if (min && max) {
        const upIndexes = range(index, -1);
        const downIndexes = range(index + 1, this.viewItems.length);
        const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
        const snapAfterIndex = this.findFirstSnapIndex(downIndexes);

        const snappedBefore =
          typeof snapBeforeIndex === 'number' &&
          !this.viewItems[snapBeforeIndex].visible;
        const snappedAfter =
          typeof snapAfterIndex === 'number' &&
          !this.viewItems[snapAfterIndex].visible;

        if (
          snappedBefore &&
          collapsesUp[index] &&
          (position > 0 || this.startSnappingEnabled)
        ) {
          sash.state = SashState.AtMinimum;
        } else if (
          snappedAfter &&
          collapsesDown[index] &&
          (position < this._contentSize || this.endSnappingEnabled)
        ) {
          sash.state = SashState.AtMaximum;
        } else {
          sash.state = SashState.Disabled;
        }
      } else if (min && !max) {
        sash.state = SashState.AtMinimum;
      } else if (!min && max) {
        sash.state = SashState.AtMaximum;
      } else {
        sash.state = SashState.Enabled;
      }
    }
  }

  private findFirstSnapIndex(indexes: number[]): number | undefined {
    // visible views first
    for (const index of indexes) {
      const viewItem = this.viewItems[index];

      if (!viewItem.visible) {
        continue;
      }

      if (viewItem.snap) {
        return index;
      }
    }

    // then, hidden views
    for (const index of indexes) {
      const viewItem = this.viewItems[index];

      if (viewItem.visible && viewItem.maximumSize - viewItem.minimumSize > 0) {
        return undefined;
      }

      if (!viewItem.visible && viewItem.snap) {
        return index;
      }
    }

    return undefined;
  }

  private layoutViews() {
    this._contentSize = this.viewItems.reduce((r, item) => r + item.size, 0);
    this.updateSashEnablement();
    this.changed();
  }
}
