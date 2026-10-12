// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
/**
 * Shared specimen data for the ProgressBar parity fixtures.
 *
 * The original page (`internal-docs/reference/progress-bar.ts`) drives the pinned ProgressBar
 * class and the Vue page (`ProgressBarSpecimen.vue`) drives the replica with the same rows,
 * geometry and call sequences, so both pages can be measured and compared identically.
 */

/** The public API of the original ProgressBar that both pages expose to the tests. */
export interface ProgressBarApi {
  show(delay?: number): unknown;
  hide(): unknown;
  infinite(): unknown;
  total(value: number): unknown;
  worked(value: number): unknown;
  setWorked(value: number): unknown;
  done(): unknown;
  stop(): unknown;
  hasTotal(): boolean;
  getContainer(): HTMLElement | undefined;
}

/** Declarative state of a row; matches the Vue props and their application order. */
export interface ProgressBarProps {
  total?: number;
  worked?: number;
  infinite?: boolean;
  visible?: boolean;
  showDelay?: number;
}

/** Imperative command applied after the declarative state. */
export interface ProgressBarStep {
  op: 'total' | 'worked' | 'setWorked' | 'infinite' | 'done' | 'stop' | 'show' | 'hide';
  value?: number;
}

export type ProgressPresentation = 'plain' | 'view' | 'editor';

export interface ProgressBarExample {
  /** Row id, also used by the tests to address a bar. */
  id: string;
  /** Accessible name; the original falls back to "Progress" for blank values. */
  label: string;
  presentation: ProgressPresentation;
  /** Header text of the sample composition (view / editor titles, plain captions). */
  title: string;
  props: ProgressBarProps;
  steps?: ProgressBarStep[];
}

/**
 * Row geometry.
 *
 * `view`: 22px pane header with the bar over its last 2px — `paneviewlet.css` puts
 * `.monaco-pane-view .pane:not(.merged-header) .monaco-progress-container` at `top: 20px`.
 * `editor`: 35px editor title with the bar at `top: 33px` — `part.css` positions
 * `.editor-group-container > .monaco-progress-container` at the bottom of the 35px title container.
 * `plain`: caller caption with the bar in normal flow, like the other classic call sites.
 */
export const progressLayout: Record<ProgressPresentation, { row: number; header: number; top?: number }> = {
  view: { row: 22, header: 22, top: 20 },
  editor: { row: 35, header: 35, top: 33 },
  plain: { row: 20, header: 16 },
};

export const progressSurfaceStyle = 'display:flex;flex-direction:column;gap:8px;padding:4px;box-sizing:border-box';

export function progressRowStyle(presentation: ProgressPresentation): string {
  const { row } = progressLayout[presentation];
  return presentation === 'plain'
    ? `position:relative;height:${row}px;display:flex;flex-direction:column`
    : `position:relative;height:${row}px`;
}

export function progressHeaderStyle(presentation: ProgressPresentation): string {
  const ellipsis = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
  if (presentation === 'view') {
    // paneview.css: `.monaco-pane-view .pane > .pane-header { height/line-height: var(--pane-header-size); font-size: 11px; font-weight: bold }`
    return `height:${progressLayout.view.header}px;line-height:${progressLayout.view.header}px;font-size:11px;font-weight:bold;padding:0 8px;${ellipsis}`;
  }
  if (presentation === 'editor') {
    return `height:${progressLayout.editor.header}px;line-height:${progressLayout.editor.header}px;padding:0 8px;${ellipsis}`;
  }
  return `height:${progressLayout.plain.header}px;line-height:${progressLayout.plain.header}px;font-size:11px;${ellipsis}`;
}

/** Absolute placement of the container, exactly like the classic call sites above. */
export function progressOverlayStyle(presentation: ProgressPresentation): Record<string, string> | undefined {
  const { top } = progressLayout[presentation];
  return top === undefined ? undefined : { position: 'absolute', left: '0', top: `${top}px` };
}

/** Applies {@link progressOverlayStyle} to a container created without Vue. */
export function applyProgressOverlayStyle(element: HTMLElement, presentation: ProgressPresentation): void {
  const style = progressOverlayStyle(presentation);
  if (style) Object.assign(element.style, style);
}

/**
 * Applies the declarative state in the order used by `ProgressBar.vue`:
 * total, worked, infinite, visibility. `visible` defaults to true and is symmetric: an explicit
 * `false` hides the bar, turning it back to true shows it again (`show(showDelay)`), exactly like
 * the component watcher derives the "currently hidden" state from its container.
 */
export function applyProgressProps(api: ProgressBarApi, props: ProgressBarProps): void {
  if (props.total !== undefined) api.total(props.total);
  if (props.worked !== undefined) api.setWorked(props.worked);
  if (props.infinite) api.infinite();
  const hidden = api.getContainer()?.style.display === 'none';
  if (props.visible === false) api.hide();
  else if (props.showDelay !== undefined || hidden) api.show(props.showDelay);
}

/** Applies imperative commands and records them; both pages log the same text. */
export function applyProgressSteps(api: ProgressBarApi, steps: ProgressBarStep[], log?: string[]): void {
  for (const step of steps) {
    log?.push(`${step.op}${step.value === undefined ? '' : `(${step.value})`}`);
    switch (step.op) {
      case 'total': api.total(step.value!); break;
      case 'worked': api.worked(step.value!); break;
      case 'setWorked': api.setWorked(step.value!); break;
      case 'infinite': api.infinite(); break;
      case 'done': api.done(); break;
      case 'stop': api.stop(); break;
      case 'show': api.show(step.value); break;
      case 'hide': api.hide(); break;
    }
  }
}

/**
 * Observable state of every bar. Animation-time dependent values (transform, resolved width)
 * stay out so the snapshot is stable while the infinite animation runs.
 */
export function snapshotProgressBars(apis: ProgressBarApi[]) {
  return apis.map(api => {
    const element = api.getContainer();
    const bit = element?.querySelector<HTMLElement>('.progress-bit');
    const containerStyle = element ? getComputedStyle(element) : undefined;
    const bitStyle = bit ? getComputedStyle(bit) : undefined;
    return {
      classes: element?.className ?? '',
      role: element?.getAttribute('role') ?? null,
      ariaLabel: element?.getAttribute('aria-label') ?? null,
      ariaValueMin: element?.getAttribute('aria-valuemin') ?? null,
      ariaValueMax: element?.getAttribute('aria-valuemax') ?? null,
      ariaValueNow: element?.getAttribute('aria-valuenow') ?? null,
      ariaHidden: element?.getAttribute('aria-hidden') ?? null,
      display: element?.style.display ?? '',
      container: { width: containerStyle?.width, height: containerStyle?.height },
      bit: {
        width: bit?.style.width ?? '', opacity: bit?.style.opacity ?? '',
        display: bitStyle?.display, backgroundColor: bitStyle?.backgroundColor,
        animationName: bitStyle?.animationName, animationDuration: bitStyle?.animationDuration,
        animationTimingFunction: bitStyle?.animationTimingFunction, animationIterationCount: bitStyle?.animationIterationCount,
      },
      hasTotal: api.hasTotal(),
    };
  });
}

/**
 * Rows of the specimen. Timed states are driven by the tests with `page.clock`
 * (10s long-running switch, 200ms `done()` cleanup, delayed `show`), the initial rows stay
 * free of timers so the first screenshot is deterministic.
 */
export const progressBarExamples: ProgressBarExample[] = [
  { id: 'view-title', label: 'Loading problems', presentation: 'view', title: 'Problems', props: { total: 200, worked: 74 } },
  { id: 'editor-title', label: 'Loading editor group', presentation: 'editor', title: 'src/components/progress-bar/ProgressBar.vue', props: { total: 100, worked: 82 } },
  { id: 'determinate-start', label: 'Indexing files (5%)', presentation: 'plain', title: 'Indexing files', props: { total: 100, worked: 5 } },
  { id: 'determinate-half', label: 'Indexing files (50%)', presentation: 'plain', title: 'Indexing files', props: { total: 100, worked: 50 } },
  { id: 'determinate-full', label: 'Uploading build', presentation: 'plain', title: 'Uploading build', props: { total: 50, worked: 50 } },
  { id: 'worked-without-total', label: 'Searching workspace', presentation: 'plain', title: 'Searching workspace', props: { worked: 40 } },
  { id: 'default-label', label: '   ', presentation: 'plain', title: '', props: { total: 100, worked: 10 } },
  { id: 'after-stop', label: 'Cancelled task', presentation: 'plain', title: 'Cancelled task', props: { total: 100, worked: 100 }, steps: [{ op: 'stop' }] },
  { id: 'infinite', label: 'Loading extensions', presentation: 'plain', title: 'Loading extensions', props: { infinite: true } },
  { id: 'infinite-long-running', label: 'Long running task', presentation: 'plain', title: 'Long running task', props: { infinite: true } },
  { id: 'done-discrete', label: 'Build finished', presentation: 'plain', title: 'Build finished', props: { total: 100, worked: 100 } },
  { id: 'done-infinite', label: 'Sync finished', presentation: 'plain', title: 'Sync finished', props: { infinite: true } },
  { id: 'hidden', label: 'Hidden task', presentation: 'plain', title: 'Hidden task', props: { total: 100, worked: 30, visible: false } },
  { id: 'delayed-show', label: 'Delayed task', presentation: 'plain', title: 'Delayed task', props: { total: 100, worked: 30, visible: false } },
];

export const progressBarIndex = Object.fromEntries(progressBarExamples.map((example, index) => [example.id, index])) as Record<string, number>;
