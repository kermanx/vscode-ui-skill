// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
/**
 * Shared specimen data for the LoadingIndicator parity fixtures.
 *
 * The original page (`internal-docs/reference/loading-indicator.ts`) drives the pinned
 * `createPixelSpinner()` and the Vue page (`LoadingIndicatorSpecimen.vue`) drives the replica
 * with the same rows, geometry and colors, so both pages can be measured and compared
 * identically. Colors are literals on purpose: the comparison is about `currentColor` being
 * inherited by the spinner, which has to hold for the original and the replica alike.
 */

/** Declarative state of a specimen row; matches the Vue props of `LoadingIndicator.vue`. */
export interface LoadingIndicatorProps {
  variant?: 'grid' | 'ring';
  ariaLabel?: string;
}

export interface LoadingIndicatorExample {
  /** Row id; also the `data-id` of the row and the key used by the tests. */
  id: string;
  /** Caption of the sample. */
  title: string;
  /** Color applied to the surrounding element; the spinner must inherit it via `currentColor`. */
  color: string;
  props: LoadingIndicatorProps;
  /** `'cell'` is the bordered specimen row, `'lead'` a bare leading slot (button sized box). */
  presentation: 'cell' | 'lead';
}

export const loadingIndicatorExamples: LoadingIndicatorExample[] = [
  { id: 'grid-decorative', title: 'grid · decorative', color: '#cccccc', props: { variant: 'grid' }, presentation: 'cell' },
  { id: 'grid-labeled', title: 'grid · aria-label', color: '#cccccc', props: { variant: 'grid', ariaLabel: 'Loading extensions' }, presentation: 'cell' },
  { id: 'ring-decorative', title: 'ring · decorative', color: '#cccccc', props: { variant: 'ring' }, presentation: 'cell' },
  { id: 'ring-labeled', title: 'ring · aria-label', color: '#cccccc', props: { variant: 'ring', ariaLabel: 'Loading extensions' }, presentation: 'cell' },
  { id: 'grid-blank-label', title: 'grid · empty aria-label', color: '#cccccc', props: { variant: 'grid', ariaLabel: '' }, presentation: 'cell' },
  { id: 'grid-whitespace-label', title: 'grid · whitespace label', color: '#cccccc', props: { variant: 'grid', ariaLabel: '   ' }, presentation: 'cell' },
  { id: 'grid-inherit', title: 'grid · inherited foreground', color: 'inherit', props: { variant: 'grid' }, presentation: 'cell' },
  { id: 'grid-on-button', title: 'grid · button foreground', color: '#ffffff', props: { variant: 'grid' }, presentation: 'cell' },
  { id: 'ring-on-secondary', title: 'ring · secondary foreground', color: '#cccccc', props: { variant: 'ring' }, presentation: 'cell' },
  { id: 'leading-button', title: 'button leading slot', color: '#ffffff', props: { variant: 'grid' }, presentation: 'lead' },
];

export const loadingIndicatorIndex = Object.fromEntries(
  loadingIndicatorExamples.map((example, index) => [example.id, index])) as Record<string, number>;

/** Geometry shared by both pages so the specimen screenshots line up pixel for pixel. */
export const spinnerBoxSize = 16;
export const spinnerCellWidth = 80;
export const spinnerCellHeight = 52;
export const spinnerCellPadding = 8;

export const loadingSurfaceStyle = 'display:flex;flex-wrap:wrap;align-content:flex-start;gap:8px;padding:4px;box-sizing:border-box';

export function spinnerCellStyle(example: LoadingIndicatorExample): string {
  // `inherit` keeps the surrounding foreground; everything else is an explicit context color.
  const color = `color:${example.color === 'inherit' ? 'inherit' : example.color};`;
  if (example.presentation === 'lead') {
    return `flex:0 0 100%;${spinnerLeadStyle}${color}`;
  }
  return `position:relative;width:${spinnerCellWidth}px;height:${spinnerCellHeight}px;` +
    `padding:${spinnerCellPadding}px;box-sizing:border-box;border:1px solid rgba(128,128,128,0.5);` +
    'display:flex;align-items:center;justify-content:center;' +
    `${color}font-size:11px;line-height:1;overflow:hidden`;
}

/** Absolute caption, so the spinner itself stays centered in the cell. */
export const spinnerCaptionStyle = 'position:absolute;left:4px;bottom:2px;font-size:9px;line-height:1;opacity:.85;white-space:nowrap';

/**
 * The bare leading slot of a text button, geometry from `button.css` / `buttonbar.css`:
 * a 16px box that inherits the button foreground and sits next to the label.
 */
export const spinnerLeadStyle = 'display:flex;align-items:center;gap:var(--vscode-spacing-size40, 4px);padding:4px 8px;box-sizing:border-box;width:100%';

/** Clipping container of the offscreen-pause canvas: the spinner starts below its visible area. */
export const scrollRegionStyle = 'height:120px;overflow:auto;margin-top:12px;border:1px solid rgba(128,128,128,0.5);box-sizing:border-box';
export const scrollSpacerStyle = 'height:320px;padding-top:240px;box-sizing:border-box';
/** Scroll offsets used by the offscreen-pause test: scrolled out of view / back into view. */
export const spinnerScrollOut = 220;
export const spinnerScrollIn = 0;

// ---------------------------------------------------------------------------------------------
// Snapshot

const DOTS = '.monaco-pixel-spinner-dot';
const PAUSED = 'monaco-pixel-spinner-paused';

/** Root classes without the spatial pause state, which the tests assert on its own. */
export function spinnerClassIdentity(root: Element): string {
  return root.className.split(' ').filter(name => name && name !== PAUSED).join(' ');
}

function snapshotDot(element: Element) {
  const style = getComputedStyle(element);
  return {
    className: element.className,
    width: style.width, height: style.height,
    borderRadius: style.borderRadius,
    backgroundColor: style.backgroundColor,
    opacity: style.opacity,
    transform: style.transform,
    display: style.display,
    animationName: style.animationName,
    animationDuration: style.animationDuration,
    animationDelay: style.animationDelay,
    animationTimingFunction: style.animationTimingFunction,
    animationIterationCount: style.animationIterationCount,
    animationPlayState: style.animationPlayState,
    // Mirrors the Web Animations API: `startTime === 0` is what the resume re-seek sets.
    animations: element.getAnimations().map(animation => ({
      animationName: (animation as CSSAnimation).animationName ?? null,
      currentTime: animation.currentTime === null ? null : Number(animation.currentTime),
      startTime: animation.startTime === null ? null : Number(animation.startTime),
      playState: animation.playState,
    })),
  };
}

/** One entry per specimen row; identical on the original and on the replica page. */
export function loadingIndicatorSnapshot(roots: HTMLElement[]) {
  return roots.map(root => {
    const style = getComputedStyle(root);
    const dots = [...root.querySelectorAll(DOTS)];
    return {
      id: root.dataset.id ?? null,
      classIdentity: spinnerClassIdentity(root),
      paused: root.classList.contains(PAUSED),
      role: root.getAttribute('role'),
      ariaLabel: root.getAttribute('aria-label'),
      ariaHidden: root.getAttribute('aria-hidden'),
      display: style.display,
      gridTemplateColumns: style.gridTemplateColumns,
      gridTemplateRows: style.gridTemplateRows,
      columnGap: style.columnGap,
      rowGap: style.rowGap,
      color: style.color,
      width: style.width,
      height: style.height,
      contain: style.contain,
      isolation: style.isolation,
      transform: style.transform,
      pointerEvents: style.pointerEvents,
      rect: { width: root.getBoundingClientRect().width, height: root.getBoundingClientRect().height },
      dotCount: dots.length,
      dots: dots.map(snapshotDot),
    };
  });
}

export type LoadingIndicatorSnapshot = ReturnType<typeof loadingIndicatorSnapshot>[number];
