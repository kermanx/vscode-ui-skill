import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import {
  loadingIndicatorExamples, loadingIndicatorIndex, spinnerBoxSize, spinnerScrollIn, spinnerScrollOut,
  type LoadingIndicatorProps, type LoadingIndicatorSnapshot,
} from '../stories/LoadingIndicatorData';

const original = (theme: string) => `${process.env.REFERENCE_URL ?? '/reference/index.html'}?kind=loading-indicator&theme=${theme}`;
const replica = (theme: string) => `/iframe.html?id=components-loading-indicator--specimen&viewMode=story&globals=theme:${theme}`;
const row = (id: string) => `[data-id="${id}"]`;
const PAUSED = 'monaco-pixel-spinner-paused';
const themes: Record<string, Record<string, string>> = JSON.parse(readFileSync(resolve(process.cwd(), 'public/reference/themes.json'), 'utf8'));

/** Frames of the two variants: one full 1820ms grid cycle and one full 1200ms ring cycle. */
const gridFrames = [0, 260, 520, 910, 1300, 1820];
const ringFrames = [0, 200, 600, 1000];

async function pair(context: BrowserContext, theme = 'dark') {
  const pages: [Page, Page] = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(original(theme));
  await pages[1].goto(replica(theme));
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady || (window as any).fixtureError);
    // Both pages start scrolled to the top, so the element screenshots below are taken from the
    // same place (`locator.screenshot` scrolls the element into view, which would move the page).
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  expect(await pages[0].evaluate(() => (window as any).fixtureError ?? null), 'original fixture error').toBeNull();
  expect(errors, 'runtime errors').toEqual([]);
  return { pages, errors };
}

const snapshot = (page: Page): Promise<LoadingIndicatorSnapshot[]> => page.evaluate(() => (window as any).fixtureSnapshot());
/**
 * Reads the offscreen canvas spinner straight from the DOM. The snapshot only refreshes when
 * `fixtureSnapshot()` runs, so the reactive class the observer toggles has to be queried live.
 */
const scrollState = (page: Page) => page.evaluate(() => {
  const element = document.querySelector('[data-id="scroll-spinner"] .monaco-pixel-spinner') as HTMLElement | null;
  if (!element) return undefined;
  const dot = element.querySelector('.monaco-pixel-spinner-dot')!.getAnimations()[0];
  return {
    classes: element.className.split(' ').filter((name: string) => name !== 'monaco-pixel-spinner-paused'),
    paused: element.classList.contains('monaco-pixel-spinner-paused'),
    playState: getComputedStyle(element.querySelector('.monaco-pixel-spinner-dot')!).animationPlayState,
    startTime: dot ? dot.startTime : null,
    currentTime: dot ? dot.currentTime : null,
  };
});
const setProps = (page: Page, id: string, patch: LoadingIndicatorProps) => page.evaluate(
  ({ index, patch }) => (window as any).fixtureSet(index, patch), { index: loadingIndicatorIndex[id], patch });
const setScroll = (page: Page, top: number) => page.evaluate(top => (window as any).fixtureSetScroll(top), top);
/** The rendered DOM of one spinner row: tag names, class names, attributes and dot order. */
const domState = (page: Page, id: string) => page.evaluate((id: string) => {
  const element = document.querySelector(`[data-id="${id}"] .monaco-pixel-spinner`)!;
  return {
    classes: element.className, tag: element.tagName,
    role: element.getAttribute('role'), ariaLabel: element.getAttribute('aria-label'), ariaHidden: element.getAttribute('aria-hidden'),
    dots: [...element.children].map(child => ({ tag: child.tagName, className: child.className })),
    childElementCount: element.childElementCount,
  };
}, id);
/** Pins every dot of the specimen to `time`; see {@link pinAnimations}. */
const pinAll = (page: Page, time: number) => pinAnimations(page, time, 'grid').then(() => pinAnimations(page, time, 'ring'));

/**
 * Resumes everything the pinning paused. Re-seeking `startTime` to 0 is exactly what the
 * workbench does when an element scrolls back into view, and it is the only way back to a
 * normal running state after `pause()`; without it the offscreen-pause checks below could not
 * observe a resume at all.
 */
const unpinAll = (page: Page) => page.evaluate(() => {
  for (const dot of document.querySelectorAll('[data-testid="specimen"] .monaco-pixel-spinner-dot')) {
    for (const animation of dot.getAnimations()) {
      if (animation.playState === 'paused') { animation.startTime = 0; animation.play(); }
    }
  }
});

const both = async (pages: readonly Page[], action: (page: Page) => Promise<unknown>) => { for (const page of pages) await action(page); };

/**
 * Pauses the dots of one variant and pins them to the same point in time on both pages.
 * `ready` is awaited so the paused time was committed before anything is measured or
 * screenshotted; reading it back right away can otherwise race the compositor and capture a
 * stale frame of the running animation. Only the specimen rows are pinned, never the third
 * spinner of the offscreen-pause canvas.
 */
function pinAnimations(page: Page, time: number, variant: 'grid' | 'ring') {
  return page.evaluate(async ({ time, variant }) => {
    // The offscreen-pause canvas has its own spinner with the same classes: leave it (and its
    // observer bookkeeping) alone, only the specimen rows are measured and screenshotted here.
    const selector = variant === 'ring'
      ? '.monaco-pixel-spinner-ring .monaco-pixel-spinner-dot'
      : '.monaco-pixel-spinner:not(.monaco-pixel-spinner-ring) .monaco-pixel-spinner-dot';
    const dots = [...document.querySelectorAll('[data-testid="specimen"] [data-index]')]
      .filter(root => variant === 'ring'
        ? !!root.querySelector('.monaco-pixel-spinner-ring')
        : !!root.querySelector('.monaco-pixel-spinner:not(.monaco-pixel-spinner-ring)'))
      .flatMap(root => [...root.querySelectorAll(selector)]);
    const animations = dots.flatMap(dot => dot.getAnimations());
    for (const animation of animations) { animation.pause(); animation.currentTime = time; }
    await Promise.all(animations.map(animation => animation.ready));
    return {
      dots: dots.length, animations: animations.length,
      playState: animations.map(animation => animation.playState),
      currentTime: animations.map(animation => animation.currentTime === null ? null : Number(animation.currentTime)),
      delays: dots.map(dot => getComputedStyle(dot).animationDelay),
      names: dots.map(dot => getComputedStyle(dot).animationName),
    };
  }, { time, variant });
}

/**
 * Screenshots one element on the integer grid. `locator.screenshot()` rounds a fractional
 * element box outward, which produced an 80×53 clip for an 80×52 row that sat at y=68.203125 —
 * the two pages then disagreed on the image size instead of on the pixels.
 */
async function shot(page: Page, target: string): Promise<Buffer> {
  const box = await page.locator(target).boundingBox();
  if (!box) throw new Error(`no box for ${target}`);
  const x = Math.floor(box.x), y = Math.floor(box.y);
  const right = Math.round(box.x + box.width), bottom = Math.round(box.y + box.height);
  return page.screenshot({ clip: { x, y, width: right - x, height: bottom - y } });
}

function diffCount(a: Buffer, b: Buffer) {
  const [left, right] = [PNG.sync.read(a), PNG.sync.read(b)];
  expect({ width: right.width, height: right.height }).toEqual({ width: left.width, height: left.height });
  const diff = new PNG({ width: left.width, height: left.height });
  return { count: pixelmatch(left.data, right.data, diff.data, left.width, left.height, { threshold: 0, includeAA: true }), left, right, diff };
}

/**
 * Screenshots the specimen on both pages and compares pixel by pixel, with zero tolerance.
 * `animations: 'disabled'` is deliberately never used: it cancels the infinite animations back
 * to their initial frame (every dot at opacity 0), which would hide a mismatch instead of
 * finding it. The caller pins the animations first instead.
 *
 * The captions stay visible: the fixture keeps the specimen as the first child of `#fixture`, so
 * both pages rasterise the label glyphs on the same subpixel phase and even the text compares
 * with zero tolerance. {@link textState} additionally asserts the text metrics and computed
 * styles, but nothing is hidden or masked out of the pixel comparison.
 */
async function pixels(pages: readonly Page[], info: TestInfo, name: string, target = '[data-testid="specimen"]') {
  const buffers: Buffer[] = [];
  for (const page of pages) {
    await page.bringToFront();
    buffers.push(await shot(page, target));
  }
  const { count, diff } = diffCount(buffers[0], buffers[1]);
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
  return buffers;
}

/**
 * The specimen labels: same text, same font, same colour and the same box on both pages, asserted
 * on top of the zero-tolerance pixel comparison (see {@link pixels}).
 * The row positions are reported relative to the first row, because the specimen sits at a
 * different page offset on either side while its internal layout has to be identical.
 */
function textState(page: Page) {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('[data-testid="specimen"] [data-id]')];
    const top = rows[0]?.getBoundingClientRect().top ?? 0;
    return rows.map(row => {
      const caption = row.querySelector('span:not(.monaco-pixel-spinner):not(.monaco-pixel-spinner-dot)') as HTMLElement | null;
      const style = caption ? getComputedStyle(caption) : undefined;
      const rect = caption?.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      return {
        text: caption?.textContent, className: caption?.className,
        fontFamily: style?.fontFamily, fontSize: style?.fontSize, fontWeight: style?.fontWeight,
        lineHeight: style?.lineHeight, letterSpacing: style?.letterSpacing, color: style?.color,
        variant: style?.fontVariant, textAlign: style?.textAlign,
        row: { width: rowRect.width, height: rowRect.height, offsetY: rowRect.top - top },
        caption: rect && { x: rect.x, offsetY: rect.y - top, width: rect.width, height: rect.height },
        // The spinner box relative to its own row: the alignment of the two must match.
        spinner: (() => {
          const spinner = row.querySelector('.monaco-pixel-spinner')!.getBoundingClientRect();
          return { x: spinner.x - rowRect.x, offsetY: spinner.top - rowRect.top, width: spinner.width, height: spinner.height };
        })(),
      };
    });
  });
}

/** Every measurable property of a snapshot, with the pinned frame itself excluded. */
const staticState = (spinner: LoadingIndicatorSnapshot) => ({
  ...spinner,
  dots: spinner.dots.map(dot => ({ ...dot, animations: dot.animations.map(animation => ({ ...animation, currentTime: 0 })) })),
});

async function equalState(pages: readonly Page[], message = 'state') {
  const [a, b] = await Promise.all(pages.map(snapshot));
  expect(b.length, `${message}: spinner count`).toBe(a.length);
  expect(b.map(staticState), `${message}: spinner state`).toEqual(a.map(staticState));
  return a;
}

const at = (spinners: LoadingIndicatorSnapshot[], id: string) => spinners[loadingIndicatorIndex[id]];

/**
 * Compares one row after a declarative prop update. A prop change re-creates the spinner (the
 * original builds a new element, Vue patches in place), so the row starts from the "just
 * created" state on both sides: the paused class is gone and the animation frame differs.
 * Waiting for the observer to clear the class, then pinning frame 910 on both pages, makes the
 * comparison cover the DOM, the aria contract and the painted dots.
 */
async function compareRow(pages: readonly Page[], id: string, message: string) {
  // The class is cleared asynchronously by the observer on the original, but synchronously by
  // Vue's own render; polling the pinned state absorbs that difference.
  await expect.poll(async () => {
    const states = await Promise.all(pages.map(page => pinnedRowState(page, id, 910)));
    return states[1] && states[0] && states[1].paused === states[0].paused ? states : null;
  }).not.toBeNull();
  const states = await Promise.all(pages.map(page => pinnedRowState(page, id, 910)));
  expect(states[1], message).toEqual(states[0]);
  expect(states[0]!.paused, `${message}: paused class cleared`).toBe(false);
  const [a, b] = await Promise.all(pages.map(snapshot));
  expect(at(b, id), message).toEqual(at(a, id));
  return at(a, id);
}

/** The row's live DOM, with the layer of animation state folded into one pinned frame. */
function pinnedRowState(page: Page, id: string, time: number) {
  return page.evaluate(({ id, time }) => {
    const root = document.querySelector(`[data-id="${id}"] .monaco-pixel-spinner`) as HTMLElement;
    if (!root) return null;
    for (const animation of root.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = time; }
    return {
      paused: root.classList.contains('monaco-pixel-spinner-paused'),
      role: root.getAttribute('role'), ariaLabel: root.getAttribute('aria-label'), ariaHidden: root.getAttribute('aria-hidden'),
      dots: [...root.children].map(child => ({ tag: child.tagName, className: child.className })),
    };
  }, { id, time });
}

for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`LoadingIndicator visual and state parity / ${theme}`, async ({ context }, info) => {
    const { pages, errors } = await pair(context, theme);
    // The running animations are pinned before anything is measured: the computed opacity and
    // transform of a dot are frame dependent, so a live snapshot would compare two different
    // frames of the same animation. Frame 910ms is inside both keyframe sets.
    await both(pages, page => pinAll(page, 910));
    const spinners = await equalState(pages, 'initial');
    // The first screenshot of the initial canvas, from the same pinned frame on both pages.
    await pixels(pages, info, 'initial');
    // Back to the running state for the behavioural checks below (scroll pause, prop updates).
    await both(pages, unpinAll);

    for (const example of loadingIndicatorExamples) {
      const spinner = at(spinners, example.id);
      const labeled = !!example.props.ariaLabel; // truthiness, exactly like the original
      const ring = example.props.variant === 'ring';
      // Same root: class names, decorative/busy contract and the box CSS that drives `currentColor`.
      expect(spinner.classIdentity, `${example.id} classes`).toBe(`monaco-pixel-spinner${ring ? ' monaco-pixel-spinner-ring' : ''}`);
      expect(spinner.role, `${example.id} role`).toBe(labeled ? 'status' : null);
      expect(spinner.ariaLabel, `${example.id} aria-label`).toBe(labeled ? example.props.ariaLabel : null);
      expect(spinner.ariaHidden, `${example.id} aria-hidden`).toBe(labeled ? null : 'true');
      expect(spinner.width, `${example.id} width`).toBe(`${spinnerBoxSize}px`);
      expect(spinner.height, `${example.id} height`).toBe(`${spinnerBoxSize}px`);
      expect(spinner.rect, `${example.id} rect`).toEqual({ width: spinnerBoxSize, height: spinnerBoxSize });
      // The authored value is `inline-grid`; a flex/grid parent blockifies it, exactly like the
      // original, so the computed value depends on the surrounding layout. The box is 16×16 in
      // both cases.
      expect(['inline-grid', 'grid'], `${example.id} display`).toContain(spinner.display);
      expect(spinner.gridTemplateColumns, `${example.id} columns`).toBe('2px 2px');
      expect(spinner.gridTemplateRows, `${example.id} rows`).toBe('2px 2px 2px');
      expect(spinner.columnGap, `${example.id} column gap`).toBe('2px');
      expect(spinner.rowGap, `${example.id} row gap`).toBe('2px');
      expect(spinner.contain, `${example.id} contain`).toBe('strict');
      expect(spinner.isolation, `${example.id} isolation`).toBe('isolate');
      expect(spinner.transform, `${example.id} transform`).toBe('matrix(1, 0, 0, 1, 0, 0)');
      expect(spinner.pointerEvents, `${example.id} pointer-events`).toBe('none');
      // Exactly six dots, in order, each one 2×2 and rounded, painted by `currentColor`.
      expect(spinner.dotCount, `${example.id} dot count`).toBe(6);
      for (const [index, dot] of spinner.dots.entries()) {
        expect(dot.className, `${example.id} dot ${index} class`).toBe('monaco-pixel-spinner-dot');
        expect(dot.width, `${example.id} dot ${index} width`).toBe('2px');
        expect(dot.height, `${example.id} dot ${index} height`).toBe('2px');
        expect(dot.borderRadius, `${example.id} dot ${index} radius`).toBe('50%');
        expect(dot.backgroundColor, `${example.id} dot ${index} color`).toBe(spinner.color);
        expect(dot.display, `${example.id} dot ${index} display`).toBe('block');
      }
    }

    // The labels around the spinners: identical text, font, colour and box positions.
    expect(await textState(pages[1]), 'specimen labels').toEqual(await textState(pages[0]));

    // The grid cascade: one animation per dot, the fifth and sixth with their own keyframes.
    const grid = at(spinners, 'grid-decorative');
    const expectedGrid: [string, string, string][] = [
      ['monaco-pixel-spinner-dot-cycle', '0.52s', '1.82s'],
      ['monaco-pixel-spinner-dot-cycle', '0.65s', '1.82s'],
      ['monaco-pixel-spinner-dot-cycle', '0.26s', '1.82s'],
      ['monaco-pixel-spinner-dot-cycle', '0.39s', '1.82s'],
      ['monaco-pixel-spinner-dot-cycle-long', '0s', '1.82s'],
      ['monaco-pixel-spinner-dot-cycle-short', '0.13s', '1.82s'],
    ];
    for (const [index, dot] of grid.dots.entries()) {
      expect([dot.animationName, dot.animationDelay, dot.animationDuration], `grid dot ${index + 1} animation`)
        .toEqual(expectedGrid[index]);
      expect(dot.animationTimingFunction, `grid dot ${index + 1} easing`).toBe('steps(6, jump-none)');
      expect(dot.animationIterationCount, `grid dot ${index + 1} iterations`).toBe('infinite');
      // The stylesheet never sets `animation-play-state`; only the paused class does, and the
      // offscreen canvas is the only place it applies. The Web Animations state below is the
      // one this test pinned.
      expect(dot.animationPlayState, `grid dot ${index + 1} stylesheet play state`).toBe('running');
      expect(dot.animations[0].playState, `grid dot ${index + 1} pinned play state`).toBe('paused');
      // A paused animation has a hold time and therefore no start time; the shared `startTime = 0`
      // origin the raster phase uses is asserted on the resume paths below.
      expect(dot.animations[0].startTime, `grid dot ${index + 1} paused has no start time`).toBeNull();
    }
    // The ring variant uses one keyframe set and its own clockwise delays.
    const ring = at(spinners, 'ring-decorative');
    const ringDelays = ['0s', '0.2s', '1s', '0.4s', '0.8s', '0.6s'];
    for (const [index, dot] of ring.dots.entries()) {
      expect([dot.animationName, dot.animationDelay, dot.animationDuration], `ring dot ${index + 1} animation`)
        .toEqual(['monaco-pixel-spinner-ring-pulse', ringDelays[index], '1.2s']);
      expect(dot.animationTimingFunction, `ring dot ${index + 1} easing`).toBe('steps(4, jump-none)');
      expect(dot.animationIterationCount, `ring dot ${index + 1} iterations`).toBe('infinite');
      expect(dot.animations[0].startTime, `ring dot ${index + 1} paused has no start time`).toBeNull();
    }

    // A visible spinner drops the paused class the observer added on creation.
    await expect.poll(async () => (await snapshot(pages[0])).map(spinner => spinner.paused), { message: 'paused classes cleared' })
      .toEqual(loadingIndicatorExamples.map(() => false));
    expect((await scrollState(pages[0]))!.paused, 'offscreen canvas starts paused').toBe(true);
    expect(await scrollState(pages[1])).toMatchObject({ paused: true });

    // Offscreen pause: scrolling the clipping container moves that spinner out of and back into
    // view. Scroll the page back to the top first, because `locator.screenshot()` above scrolled
    // the canvas into view to capture it.
    await both(pages, page => page.evaluate(() => window.scrollTo(0, 0)));
    await both(pages, page => setScroll(page, spinnerScrollIn));
    const restingPlace = await Promise.all(pages.map(scrollState));
    expect(restingPlace[0], 'canvas spinner starts out of view').toMatchObject({ paused: true, playState: 'paused' });
    expect(restingPlace[1]).toMatchObject({ paused: true, playState: 'paused' });
    await both(pages, page => setScroll(page, spinnerScrollOut));
    await expect.poll(async () => (await Promise.all(pages.map(scrollState))).map(state => [state!.paused, state!.playState]))
      .toEqual([[false, 'running'], [false, 'running']]);
    const visibleClock = await Promise.all(pages.map(scrollState));
    // Everything except the live clock, which is the one value that cannot be compared while
    // the animation runs.
    const clockContract = (state: NonNullable<Awaited<ReturnType<typeof scrollState>>>) =>
      ({ classes: state.classes, paused: state.paused, playState: state.playState, startTime: state.startTime });
    expect(clockContract(visibleClock[1]!)).toEqual(clockContract(visibleClock[0]!));
    expect(visibleClock[0]!.startTime, 'resumed animation re-seeked to the shared origin').toBe(0);
    await both(pages, page => setScroll(page, spinnerScrollIn));
    await expect.poll(async () => (await Promise.all(pages.map(scrollState))).map(state => [state!.paused, state!.playState]))
      .toEqual([[true, 'paused'], [true, 'paused']]);
    await both(pages, page => setScroll(page, spinnerScrollOut));
    await expect.poll(async () => (await Promise.all(pages.map(scrollState))).map(state => state!.startTime), { message: 'resync after scrolling back' })
      .toEqual([0, 0]);

    // Colour comes from the surrounding element only.
    expect(at(spinners, 'grid-on-button').color).toBe('rgb(255, 255, 255)');
    expect(at(spinners, 'ring-on-secondary').color).toBe('rgb(204, 204, 204)');
    expect(at(spinners, 'grid-inherit').color)
      .toBe(await pages[0].evaluate(() => getComputedStyle(document.querySelector('[data-id="grid-inherit"]')!).color));

    // A blank label is decorative on both sides; the button leading slot keeps its 16px box.
    expect(await domState(pages[1], 'grid-blank-label')).toEqual(await domState(pages[0], 'grid-blank-label'));
    expect(await domState(pages[0], 'grid-blank-label')).toMatchObject({ role: null, ariaLabel: null, ariaHidden: 'true' });
    // A whitespace-only label is a truthy string upstream, so it stays a (blank) status name
    // instead of becoming decorative — the string test is not trimmed.
    expect(await domState(pages[0], 'grid-whitespace-label')).toMatchObject({ role: 'status', ariaLabel: '   ', ariaHidden: null });
    expect(await domState(pages[1], 'grid-whitespace-label')).toEqual(await domState(pages[0], 'grid-whitespace-label'));
    expect(await domState(pages[1], 'leading-button')).toEqual(await domState(pages[0], 'leading-button'));
    expect(await pages[1].locator(`${row('leading-button')} .monaco-button-label`).textContent()).toBe('Installing');
    expect(await pages[1].locator(`${row('leading-button')} .monaco-pixel-spinner`).evaluate(element => element.getBoundingClientRect().width)).toBe(spinnerBoxSize);
    expect(await pages[1].locator(`${row('leading-button')} .monaco-pixel-spinner`).evaluate(element => element.nextElementSibling?.className)).toBe('monaco-button-label');

    // Declarative updates: same DOM on both sides, no stale aria attribute left behind. A prop
    // change re-creates the spinner on the original and patches it on the Vue side, so the
    // comparison waits for the observer to clear the paused class and pins one frame first.
    await both(pages, page => setProps(page, 'grid-decorative', { ariaLabel: 'Loading workspace' }));
    const decorated = await compareRow(pages, 'grid-decorative', 'grid decorated');
    expect(decorated).toMatchObject({ role: 'status', ariaLabel: 'Loading workspace', ariaHidden: null });
    await both(pages, page => setProps(page, 'grid-labeled', { variant: 'ring' }));
    const switched = await compareRow(pages, 'grid-labeled', 'grid switched to ring');
    expect(switched.classIdentity).toBe('monaco-pixel-spinner monaco-pixel-spinner-ring');
    await both(pages, page => setProps(page, 'grid-labeled', { ariaLabel: '' }));
    const emptied = await compareRow(pages, 'grid-labeled', 'empty label back to decorative');
    expect(emptied).toMatchObject({ role: null, ariaLabel: null, ariaHidden: 'true' });
    await both(pages, page => setProps(page, 'grid-labeled', { ariaLabel: '   ' }));
    const whitespace = await compareRow(pages, 'grid-labeled', 'whitespace label is truthy');
    expect(whitespace).toMatchObject({ role: 'status', ariaLabel: '   ', ariaHidden: null });

    // The labeled spinners are exposed as `status` on both sides.
    expect(await pages[1].locator('[role="status"]').count()).toBe(await pages[0].locator('[role="status"]').count());
    expect(await pages[1].locator('[role="status"]').count()).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test(`LoadingIndicator animation frames / ${theme}`, async ({ context }, info) => {
    const { pages, errors } = await pair(context, theme);
    const frames = new Map<number, Buffer>();
    for (const time of gridFrames) {
      const states = await Promise.all(pages.map(page => pinAnimations(page, time, 'grid')));
      expect(states[1], `grid animation state at ${time}ms`).toEqual(states[0]);
      // Seven grid spinners in the specimen (the offscreen canvas has its own, untouched).
      expect(states[0]).toMatchObject({ dots: 42, animations: 42 });
      expect(new Set(states[0].playState)).toEqual(new Set(['paused']));
      expect(states[0].currentTime.every(value => value === time)).toBe(true);
      frames.set(time, (await pixels(pages, info, `grid-${time}`, row('grid-decorative')))[0]);
    }
    for (const time of ringFrames) {
      const states = await Promise.all(pages.map(page => pinAnimations(page, time, 'ring')));
      expect(states[1], `ring animation state at ${time}ms`).toEqual(states[0]);
      expect(states[0]).toMatchObject({ dots: 18, animations: 18 });
      expect(states[0].currentTime.every(value => value === time)).toBe(true);
      await pixels(pages, info, `ring-${time}`, row('ring-decorative'));
    }
    // Self check: the keyframes really move the dots; a frozen pair of pages could not pass this.
    expect(diffCount(frames.get(gridFrames[0])!, frames.get(gridFrames[1])!).count, 'self check: 0ms vs 260ms differ').toBeGreaterThan(0);
    expect(diffCount(frames.get(gridFrames[1])!, frames.get(gridFrames[2])!).count, 'self check: 260ms vs 520ms differ').toBeGreaterThan(0);
    expect(diffCount(frames.get(gridFrames[3])!, frames.get(gridFrames[5])!).count, 'self check: 910ms vs 1820ms differ').toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
}

test('LoadingIndicator uses the static fallback when prefers-reduced-motion is reduce', async ({ context: browserContext }, info) => {
  // The emulation is per page and has to be set before navigation, so the pages are created
  // here instead of through `pair()` (which navigates right away).
  const pages: [Page, Page] = [await browserContext.newPage(), await browserContext.newPage()];
  const errors: string[] = [];
  for (const page of pages) {
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
  }
  await pages[0].goto(original('dark'));
  await pages[1].goto(replica('dark'));
  for (const page of pages) await page.waitForFunction(() => (window as any).fixtureReady || (window as any).fixtureError);
  expect(await pages[0].evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  // No animation is created at all: every dot is a static, fully opaque 2px pixel.
  const spinners = await equalState(pages, 'reduced motion');
  // Upstream bug kept as-is: the `prefers-reduced-motion` block disables every dot through the
  // `animation` shorthand, but the more specific `:nth-child(5|6)` rules still declare their own
  // `animation-name`. No animation is created for them (the rest of their timing is `none`), yet
  // the computed name differs — which is exactly what the pinned stylesheet does on both sides.
  const gridNames = ['none', 'none', 'none', 'none',
    'monaco-pixel-spinner-dot-cycle-long', 'monaco-pixel-spinner-dot-cycle-short'];
  const zeroDuration = new Set([4, 5]);
  for (const example of loadingIndicatorExamples) {
    const spinner = at(spinners, example.id);
    const ring = example.props.variant === 'ring';
    for (const [index, dot] of spinner.dots.entries()) {
      const expectedName = ring ? 'none' : gridNames[index];
      expect(dot.animationName, `${example.id} dot ${index} animation`).toBe(expectedName);
      if (!ring && zeroDuration.has(index)) {
        // The name survives, but every other longhand is `none`, so whatever the browser keeps
        // for these two dots holds its first keyframe: they cannot move. Chromium reports no
        // animation object for them at all, which is the strictest form of the fallback.
        expect(dot.animations.length, `${example.id} dot ${index} animations`).toBeLessThanOrEqual(1);
      } else {
        expect(dot.animations, `${example.id} dot ${index} animations`).toEqual([]);
      }
      expect(dot.opacity, `${example.id} dot ${index} opacity`).toBe(expectedName === 'none' ? '1' : dot.opacity);
      if (expectedName === 'none') expect(dot.transform, `${example.id} dot ${index} transform`).toBe('matrix(1, 0, 0, 1, 0, 0)');
    }
  }
  // Nothing can move: the only CSS animation objects left are the two zero-duration dots above,
  // which hold their first keyframe forever. Their frames are pinned anyway so the screenshot
  // below cannot depend on when the page happened to be captured.
  for (const page of pages) {
    expect(await page.evaluate(() => document.getAnimations().length), 'no running animation').toBeLessThanOrEqual(8);
    await page.evaluate(async () => {
      for (const animation of document.getAnimations()) { animation.pause(); animation.currentTime = 0; }
    });
  }
  await pixels(pages, info, 'reduced-motion');
  expect(errors).toEqual([]);
});

test('LoadingIndicator pauses and resyncs on document visibilitychange', async ({ context }) => {
  const { pages, errors } = await pair(context, 'dark');
  const [fixture, page] = pages;
  const read = (target: Page) => target.evaluate(() => {
    const root = document.querySelector('[data-id="grid-decorative"] .monaco-pixel-spinner') as HTMLElement;
    const animation = root.querySelector('.monaco-pixel-spinner-dot')!.getAnimations()[0];
    return { paused: root.classList.contains('monaco-pixel-spinner-paused'), playState: animation.playState, startTime: animation.startTime };
  });
  const setHidden = (target: Page, hidden: boolean) => target.evaluate((hidden: boolean) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  await expect.poll(() => read(page).then(state => state.paused)).toBe(false);

  // `document.hidden` is read-only and headless Chromium never hides the document, so the probe
  // overrides the getter and dispatches the real `visibilitychange` event afterwards. This drives
  // the listener exactly like a background tab would; it is a synthetic hide, not an observed one.
  await setHidden(page, true);
  await expect.poll(() => read(page).then(state => [state.paused, state.playState])).toEqual([true, 'paused']);
  await setHidden(page, false);
  await expect.poll(() => read(page).then(state => [state.paused, state.playState, state.startTime])).toEqual([false, 'running', 0]);

  // The pinned original reacts the same way to the same event.
  await setHidden(fixture, true);
  await expect.poll(() => read(fixture).then(state => [state.paused, state.playState])).toEqual([true, 'paused']);
  await setHidden(fixture, false);
  await expect.poll(() => read(fixture).then(state => state.startTime)).toBe(0);
  expect(errors).toEqual([]);
});

test('LoadingIndicator disposes its visibility tracking on unmount', async ({ context }) => {
  const { pages, errors } = await pair(context, 'dark');
  const [fixture, page] = pages;

  // Probe the tracking from here on: the per-window IntersectionObserver and the single
  // `visibilitychange` listener shared by every spinner of that window.
  const install = (target: Page) => target.evaluate(() => {
    const probe = { created: 0, observe: 0, unobserve: 0, disconnect: 0, listeners: 0 };
    const realObserver = window.IntersectionObserver;
    class ProbeObserver extends realObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options);
        probe.created++;
      }
      override observe(target: Element, options?: IntersectionObserverInit) { probe.observe++; return super.observe(target, options); }
      override unobserve(target: Element) { probe.unobserve++; return super.unobserve(target); }
      override disconnect() { probe.disconnect++; return super.disconnect(); }
    }
    window.IntersectionObserver = ProbeObserver as unknown as typeof IntersectionObserver;
    const realAdd = document.addEventListener.bind(document);
    const realRemove = document.removeEventListener.bind(document);
    const tracked = new Set<EventListenerOrEventListenerObject>();
    document.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: unknown) => {
      if (type === 'visibilitychange' && listener) { tracked.add(listener); probe.listeners = tracked.size; }
      return realAdd(type, listener as EventListener, options as AddEventListenerOptions);
    }) as typeof document.addEventListener;
    document.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: unknown) => {
      if (type === 'visibilitychange' && listener) { tracked.delete(listener); probe.listeners = tracked.size; }
      return realRemove(type, listener as EventListener, options as AddEventListenerOptions);
    }) as typeof document.removeEventListener;
    (window as any).__probe = { read: () => ({ ...probe }) };
  });
  await install(fixture);
  await install(page);

  // The probe replaced the constructor after the first mount, so the tracking is re-created.
  const total = loadingIndicatorExamples.length + 1; // nine rows plus the offscreen canvas
  for (const target of pages) await target.evaluate(() => (window as any).fixtureUnmount());
  await expect.poll(() => page.locator('.monaco-pixel-spinner').count()).toBe(0);
  for (const target of pages) await target.evaluate(() => (window as any).fixtureMount());
  await expect.poll(() => page.locator('[data-testid="specimen"] .monaco-pixel-spinner').count()).toBe(loadingIndicatorExamples.length);

  const afterMount = await page.evaluate(() => (window as any).__probe.read());
  expect(afterMount).toEqual({ created: 1, observe: total, unobserve: 0, disconnect: 0, listeners: 1 });

  // Unmount: every element is unobserved, the paused class is gone and the observer plus its
  // listener are dropped because nothing is left to track.
  await page.evaluate(() => (window as any).fixtureUnmount());
  await expect.poll(() => page.evaluate(() => (window as any).__probe.read())).toEqual({ created: 1, observe: total, unobserve: total, disconnect: 1, listeners: 0 });
  expect(await page.locator('.monaco-pixel-spinner').count(), 'no spinner left').toBe(0);
  expect(await page.locator(`.${PAUSED}`).count()).toBe(0);

  // Nothing is re-created afterwards, and the disposed observer fires no callback.
  const before = await page.evaluate(() => (window as any).__probe.read());
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => (window as any).__probe.read()), 'no tracking re-created after unmount').toEqual(before);

  // Remounting starts from a clean slate: a fresh observer and a fresh listener.
  await page.evaluate(() => (window as any).fixtureMount());
  await expect.poll(() => page.evaluate(() => (window as any).__probe.read())).toEqual({ created: 2, observe: 2 * total, unobserve: total, disconnect: 1, listeners: 1 });
  expect(await page.locator('[data-testid="specimen"] .monaco-pixel-spinner').count()).toBe(loadingIndicatorExamples.length);

  // Disposing the pinned original leaves no paused class and no error either.
  const fixtureProbe = () => fixture.evaluate(() => (window as any).__probe.read());
  expect((await fixtureProbe()).unobserve, 'nothing disposed on the original yet').toBe(0);
  await fixture.evaluate(() => (window as any).fixtureUnmount());
  await expect.poll(fixtureProbe).toMatchObject({ unobserve: total, disconnect: 1, listeners: 0 });
  expect(await fixture.locator(`.${PAUSED}`).count()).toBe(0);
  expect(errors).toEqual([]);
});

test('LoadingIndicator specimen canvas only differs between themes through currentColor', async ({ context }) => {
  // The spinner paints no theme token: the only thing a theme can change is the `currentColor`
  // it inherits, which is what the literals and the `inherit` row are here to show. Everything
  // else — geometry, classes, aria contract, animation parameters and frame-910 pixels — has to
  // be identical in all four themes.
  const expectedInherited: Record<string, string> = {};
  const inherited: string[] = [];
  let painted: string | null = null;
  for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
    const { pages } = await pair(context, theme);
    const spinners = await Promise.all(pages.map(page => pinAll(page, 910).then(() => snapshot(page))));
    expect(spinners[1].map(staticState), `theme ${theme}`).toEqual(spinners[0].map(staticState));
    const rows = spinners[0].slice(0, loadingIndicatorExamples.length);
    expect(at(rows, 'grid-decorative').color, `${theme} literal foreground`).toBe('rgb(204, 204, 204)');
    expect(at(rows, 'grid-on-button').color, `${theme} button foreground`).toBe('rgb(255, 255, 255)');
    expect(at(rows, 'ring-on-secondary').color, `${theme} secondary foreground`).toBe('rgb(204, 204, 204)');
    const contextColor = await pages[0].evaluate(() => getComputedStyle(document.querySelector('[data-id="grid-inherit"]')!).color);
    expectedInherited[theme] = contextColor;
    inherited.push(at(rows, 'grid-inherit').color);
    // The theme foreground really is what the `inherit` row picks up.
    expect(at(rows, 'grid-inherit').color, `${theme} inherited foreground`).toBe(contextColor);
    expect(themes[theme]['foreground'], `${theme} has a foreground token`).toBeTruthy();
    const withoutColor = rows.map(spinner => JSON.stringify({
      ...staticState(spinner), color: undefined,
      dots: spinner.dots.map(dot => ({ ...dot, backgroundColor: undefined })),
    }));
    painted = painted === null ? JSON.stringify(withoutColor) : painted === JSON.stringify(withoutColor) ? painted : 'DIFFERENT';
  }
  // The four themes really do resolve four different foregrounds, and every inherited dot
  // follows its own theme instead of a hard-coded literal.
  expect(new Set(Object.values(expectedInherited)).size).toBe(4);
  expect(inherited).toEqual(['rgb(204, 204, 204)', 'rgb(97, 97, 97)', 'rgb(255, 255, 255)', 'rgb(41, 41, 41)']);
  expect(painted, 'theme independent canvas').not.toBe('DIFFERENT');
});

test('LoadingIndicator keeps the pinned workbench source contract', async () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/loading-indicator/LoadingIndicator.vue'), 'utf8');
  const sync = readFileSync(resolve(process.cwd(), 'src/components/loading-indicator/animationSync.ts'), 'utf8');
  const upstream = readFileSync(resolve(process.cwd(), '../vscode/src/vs/base/browser/ui/pixelSpinner/pixelSpinner.css'), 'utf8');
  const copy = readFileSync(resolve(process.cwd(), 'src/components/loading-indicator/pixelSpinner.css'), 'utf8');
  expect(copy, 'pixelSpinner.css is a verbatim copy').toBe(upstream);
  for (const source of [component, sync]) {
    // Only the upstream file names may be mentioned, in the provenance comments; nothing is
    // imported from the clone and no path into it is left behind.
    expect(source, 'no clone path in the component source').not.toContain('vscode/');
    expect(source, 'no clone import').not.toMatch(/from\s+['"][^'"]*vs\/base/);
  }
  expect(component, 'six dots, in order').toContain('v-for="index in 6"');
  expect(component, 'the paused class is the workbench name').toContain('monaco-pixel-spinner-paused');
  // Animation timings are not configurable: they live in the copied stylesheet only.
  expect(component).not.toMatch(/1820|1200|520|650/);
  expect(sync, 'the resume path re-seeks the shared origin').toContain('animation.startTime = 0');
});
