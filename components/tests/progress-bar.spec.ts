import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { progressBarIndex, type ProgressBarProps, type ProgressBarStep } from '../stories/ProgressBarData';

const original = (theme: string) => `${process.env.REFERENCE_URL ?? '/reference/index.html'}?kind=progress-bar&theme=${theme}`;
const replica = (theme: string) => `/iframe.html?id=components-progress-bar--specimen&viewMode=story&globals=theme:${theme}`;
const row = (id: string) => `[data-id="${id}"]`;
async function pair(context: BrowserContext, theme = 'dark', options: { clock?: boolean } = {}) {
  const pages: [Page, Page] = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  // The clock is context wide; install it before navigation so component timers are fake.
  if (options.clock) await context.clock.install();
  await pages[0].goto(original(theme));
  await pages[1].goto(replica(theme));
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  // A running infinite bar never stops moving its bit, which makes Playwright's "element is
  // stable" wait before every locator screenshot racy. Both pages pin every animation to time 0
  // instead; the animation contract is asserted separately by pinning explicit times.
  for (const page of pages) await page.evaluate(() => {
    for (const bit of document.querySelectorAll('.monaco-progress-container .progress-bit')) {
      for (const animation of bit.getAnimations()) { animation.pause(); animation.currentTime = 0; }
    }
  });
  // Freeze after loading: `pauseAt` jumps a little forward, no component timer is due by then.
  if (options.clock) await context.clock.pauseAt(Date.now() + 1000);
  expect(errors, 'runtime errors').toEqual([]);
  return { pages, errors };
}

const snapshot = (page: Page): Promise<{ bars: any[]; calls: string[] }> => page.evaluate(() => (window as any).fixtureSnapshot());
const barState = async (page: Page, id: string) => (await snapshot(page)).bars[progressBarIndex[id]];
const ids = (element: { classes: string }) => element.classes.split(' ').filter(name => name !== 'monaco-progress-container');
const setProps = (page: Page, id: string, patch: ProgressBarProps) => page.evaluate(({ index, patch }) => (window as any).fixtureSet(index, patch), { index: progressBarIndex[id], patch });
const run = (page: Page, id: string, steps: ProgressBarStep[]) => page.evaluate(({ index, steps }) => (window as any).fixtureRun(index, steps), { index: progressBarIndex[id], steps });
const both = async (pages: readonly Page[], action: (page: Page) => Promise<unknown>) => { for (const page of pages) await action(page); };

async function equalState(pages: readonly Page[], message = 'state') {
  const [a, b] = await Promise.all(pages.map(snapshot));
  expect(b.calls, `${message}: call log`).toEqual(a.calls);
  expect(b.bars, `${message}: bar state`).toEqual(a.bars);
}

function diffCount(a: Buffer, b: Buffer) {
  const [left, right] = [PNG.sync.read(a), PNG.sync.read(b)];
  expect({ width: right.width, height: right.height }).toEqual({ width: left.width, height: left.height });
  const diff = new PNG({ width: left.width, height: left.height });
  return { count: pixelmatch(left.data, right.data, diff.data, left.width, left.height, { threshold: 0, includeAA: true }), left, right, diff };
}

async function pixels(pages: readonly Page[], info: TestInfo, name: string,
  options: { target?: string; settle?: boolean; disableAnimations?: boolean } = {}) {
  const { target, settle = true, disableAnimations = true } = options;
  const buffers: Buffer[] = [];
  for (const page of pages) {
    await page.bringToFront();
    if (settle) await page.evaluate(async () => {
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      // Finite animations such as the 100ms discrete width transition must settle on both pages
      // before comparing; the infinite ones are already pinned and would never finish.
      const finite = document.getAnimations().filter(animation => animation.playState === 'running'
        && animation.effect?.getComputedTiming().iterations !== Infinity);
      await Promise.all(finite.map(animation => animation.finished.catch(() => undefined)));
    });
    buffers.push(await (target ? page.locator(target) : page.getByTestId('specimen')).screenshot(disableAnimations ? { animations: 'disabled' } : {}));
  }
  const { count, diff } = diffCount(buffers[0], buffers[1]);
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
  return buffers;
}

/**
 * Pauses the row's animations and pins them to the same point in time on both pages.
 * `ready` is awaited so the paused time has been committed before anything is measured or
 * screenshotted: reading the time back immediately can otherwise race the compositor and
 * capture a stale frame of the running animation. The animation object only exists once style
 * resolution has picked up the class-driven animation, so the lookup retries across frames; a
 * missing animation would otherwise leave the bit running and hang the screenshot on
 * Playwright's "element is stable" wait instead of failing.
 */
function setAnimationTime(page: Page, target: string, time: number) {
  return page.evaluate(async ({ target, time }) => {
    const bit = document.querySelector(target)!.querySelector('.progress-bit') as HTMLElement;
    let animations = bit.getAnimations();
    for (let attempt = 0; attempt < 10 && animations.length === 0; attempt++) {
      await new Promise(requestAnimationFrame);
      animations = bit.getAnimations();
    }
    for (const animation of animations) { animation.pause(); animation.currentTime = time; }
    await Promise.all(animations.map(animation => animation.ready));
    const style = getComputedStyle(bit);
    return {
      count: animations.length,
      animations: animations.map(animation => ({ currentTime: animation.currentTime, playState: animation.playState })),
      transform: style.transform,
      animationName: style.animationName,
      animationDuration: style.animationDuration,
      animationTimingFunction: style.animationTimingFunction,
      animationIterationCount: style.animationIterationCount,
    };
  }, { target, time });
}

for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`ProgressBar visual and state parity / ${theme}`, async ({ context }, info) => {
    const { pages, errors } = await pair(context, theme);
    await equalState(pages, 'initial');
    await pixels(pages, info, 'initial');

    // Determinate levels: total sets aria-valuemax, the bit follows worked / total.
    await both(pages, page => setProps(page, 'determinate-half', { total: 200, worked: 74 }));
    await equalState(pages, 'total 200');
    expect(await barState(pages[0], 'determinate-half')).toMatchObject({ ariaValueMax: '200', ariaValueNow: '74', display: '', hasTotal: true });
    expect((await barState(pages[0], 'determinate-half')).bit.width).toBe('37%');
    await pixels(pages, info, 'total-200', { target: row('determinate-half') });

    // worked() accumulates; the width clamps to the total while aria-valuenow keeps the raw sum.
    await both(pages, page => run(page, 'determinate-half', [{ op: 'worked', value: 0 }]));
    await equalState(pages, 'worked(0)');
    expect(await barState(pages[0], 'determinate-half')).toMatchObject({ ariaValueNow: '75', hasTotal: true });
    expect((await barState(pages[0], 'determinate-half')).bit.width).toBe('37.5%');
    await both(pages, page => run(page, 'determinate-half', [{ op: 'worked', value: 500 }]));
    await equalState(pages, 'clamped');
    expect(await barState(pages[0], 'determinate-half')).toMatchObject({ ariaValueNow: '575', hasTotal: true });
    expect((await barState(pages[0], 'determinate-half')).bit.width).toBe('100%');
    await pixels(pages, info, 'clamped', { target: row('determinate-half') });

    // No total: 0-100 scale, `hasTotal()` false.
    await both(pages, page => setProps(page, 'worked-without-total', { worked: 100 }));
    await equalState(pages, 'no total');
    expect(await barState(pages[0], 'worked-without-total')).toMatchObject({ ariaValueMax: null, ariaValueNow: '100', hasTotal: false });
    expect((await barState(pages[0], 'worked-without-total')).bit.width).toBe('100%');
    await pixels(pages, info, 'no-total', { target: row('worked-without-total') });

    // Infinite -> discrete: the discrete classes replace the infinite ones.
    await both(pages, page => setProps(page, 'infinite', { infinite: false, total: 100, worked: 40 }));
    await equalState(pages, 'infinite to discrete');
    expect(ids(await barState(pages[0], 'infinite'))).toEqual(['active', 'discrete']);
    await pixels(pages, info, 'discrete-after-infinite', { target: row('infinite') });

    // Blank aria labels fall back to "Progress".
    expect(await barState(pages[0], 'default-label')).toMatchObject({ ariaLabel: 'Progress', role: 'progressbar', ariaValueMin: '0' });
    // Hiding keeps the layout but removes the bar from the accessibility tree.
    expect(await barState(pages[0], 'hidden')).toMatchObject({ display: 'none', ariaHidden: 'true', ariaValueNow: '30' });
    expect(await barState(pages[0], 'delayed-show')).toMatchObject({ display: 'none', ariaHidden: 'true' });
    // stop() during mount leaves a settled "done" container behind.
    expect(ids(await barState(pages[0], 'after-stop'))).toEqual(['done']);
    expect(await barState(pages[0], 'after-stop')).toMatchObject({ hasTotal: false, display: '' });
    expect((await barState(pages[0], 'after-stop')).bit.display).toBe('none');
    expect(errors).toEqual([]);
  });

  test(`ProgressBar infinite animation frames / ${theme}`, async ({ context }, info) => {
    const { pages, errors } = await pair(context, theme);
    const target = row('infinite');
    const frames = new Map<number, Buffer>();
    // 4s per iteration: 0%, 25%, 50%, 75% of the keyframes.
    for (const time of [0, 1000, 2000, 3000]) {
      const states = [];
      for (const page of pages) states.push(await setAnimationTime(page, target, time));
      expect(states[1], `animation state at ${time}ms`).toEqual(states[0]);
      expect(states[0]).toMatchObject({ animationName: 'progress', animationDuration: '4s', animationTimingFunction: 'linear', animationIterationCount: 'infinite' });
      // Both pages must expose the animation object; otherwise the screenshot would race a
      // still-running bit instead of comparing a pinned frame.
      expect(states[0].count, `pinned animation objects at ${time}ms`).toBeGreaterThan(0);
      frames.set(time, (await pixels(pages, info, `frame-${time}`, { target, settle: false, disableAnimations: false }))[0]);
    }
    // Self check: the keyframes really move the bit (a frozen pair of pages could not pass this).
    expect(diffCount(frames.get(0)!, frames.get(2000)!).count, 'self check: 0ms vs 2000ms differ').toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
}

test('ProgressBar switches to the throttled long-running animation after 10s', async ({ context }, info) => {
  const { pages, errors } = await pair(context, 'dark', { clock: true });
  const target = row('infinite-long-running');
  await both(pages, page => run(page, 'infinite-long-running', [{ op: 'infinite' }]));
  await equalState(pages, 'restarted infinite');
  expect((await setAnimationTime(pages[0], target, 0)).animationTimingFunction).toBe('linear');

  // The clock is context wide: every advance happens exactly once for both pages.
  await context.clock.fastForward(9999);
  await equalState(pages, 'before 10s');
  expect(ids(await barState(pages[0], 'infinite-long-running'))).toEqual(['active', 'infinite']);
  expect((await setAnimationTime(pages[0], target, 0)).animationTimingFunction).toBe('linear');

  await context.clock.fastForward(1);
  await equalState(pages, 'after 10s');
  expect(ids(await barState(pages[0], 'infinite-long-running'))).toEqual(['active', 'infinite', 'infinite-long-running']);
  // steps(100) throttles the animation without changing the animation itself.
  expect((await setAnimationTime(pages[0], target, 0))).toMatchObject({ animationName: 'progress', animationDuration: '4s', animationTimingFunction: 'steps(100)', animationIterationCount: 'infinite' });
  await pixels(pages, info, 'long-running', { target, settle: false });
  expect(errors).toEqual([]);
});

test('ProgressBar done() cleans up after 200ms while stop() is immediate', async ({ context }, info) => {
  const { pages, errors } = await pair(context, 'dark', { clock: true });

  // discrete done(): the bit grows to 100% and the container is cleaned 200ms later.
  await both(pages, page => setProps(page, 'done-discrete', { total: 100, worked: 40 }));
  await both(pages, page => run(page, 'done-discrete', [{ op: 'done' }]));
  await equalState(pages, 'discrete done');
  expect(ids(await barState(pages[0], 'done-discrete'))).toEqual(['active', 'discrete', 'done']);
  // The discrete path only touches the width; opacity is untouched until the cleanup.
  expect((await barState(pages[0], 'done-discrete')).bit).toMatchObject({ width: 'inherit', opacity: '' });
  await pixels(pages, info, 'discrete-done', { target: row('done-discrete'), settle: false });

  await context.clock.fastForward(199);
  await equalState(pages, 'discrete done +199ms');
  expect(ids(await barState(pages[0], 'done-discrete'))).toEqual(['active', 'discrete', 'done']);
  await context.clock.fastForward(1);
  await equalState(pages, 'discrete done +200ms');
  expect(ids(await barState(pages[0], 'done-discrete'))).toEqual(['done']);
  expect(await barState(pages[0], 'done-discrete')).toMatchObject({ hasTotal: false, display: '', ariaValueNow: '40' });
  expect((await barState(pages[0], 'done-discrete')).bit).toMatchObject({ width: 'inherit', opacity: '1', display: 'none' });
  await pixels(pages, info, 'discrete-done-cleaned', { target: row('done-discrete'), settle: false });

  // infinite done(): opacity 0 first, cleanup 200ms later.
  await both(pages, page => run(page, 'done-infinite', [{ op: 'done' }]));
  await equalState(pages, 'infinite done');
  expect(ids(await barState(pages[0], 'done-infinite'))).toEqual(['active', 'infinite', 'done']);
  expect((await barState(pages[0], 'done-infinite')).bit.opacity).toBe('0');
  await pixels(pages, info, 'infinite-done', { target: row('done-infinite'), settle: false });
  await context.clock.fastForward(199);
  expect((await barState(pages[0], 'done-infinite')).bit.opacity).toBe('0');
  await context.clock.fastForward(1);
  await equalState(pages, 'infinite done +200ms');
  expect(ids(await barState(pages[0], 'done-infinite'))).toEqual(['done']);
  expect((await barState(pages[0], 'done-infinite')).bit).toMatchObject({ opacity: '1', width: 'inherit', display: 'none' });

  // stop(): same classes without the delay.
  await both(pages, page => run(page, 'determinate-half', [{ op: 'setWorked', value: 50 }, { op: 'stop' }]));
  await equalState(pages, 'stop');
  expect(ids(await barState(pages[0], 'determinate-half'))).toEqual(['done']);
  expect((await barState(pages[0], 'determinate-half')).bit).toMatchObject({ width: 'inherit', display: 'none' });
  await pixels(pages, info, 'stopped', { target: row('determinate-half'), settle: false });
  expect(errors).toEqual([]);
});

test('ProgressBar show(delay) and hide() control display and aria-hidden', async ({ context }) => {
  const { pages, errors } = await pair(context, 'dark', { clock: true });
  const id = 'delayed-show';
  const hiddenState = { display: 'none', ariaHidden: 'true' };
  expect(await barState(pages[0], id)).toMatchObject(hiddenState);

  // show(delay) only reveals the bar once the timer fired.
  await both(pages, page => run(page, id, [{ op: 'show', value: 250 }]));
  await equalState(pages, 'show(250) scheduled');
  expect(await barState(pages[0], id)).toMatchObject(hiddenState);
  await context.clock.fastForward(249);
  expect(await barState(pages[0], id)).toMatchObject(hiddenState);
  await context.clock.fastForward(1);
  await equalState(pages, 'show(250) fired');
  expect(await barState(pages[0], id)).toMatchObject({ display: '', ariaHidden: null });

  // show() without a delay is immediate, show(0) still goes through the scheduler.
  await both(pages, page => run(page, id, [{ op: 'hide' }]));
  await both(pages, page => run(page, id, [{ op: 'show' }]));
  await equalState(pages, 'show()');
  expect(await barState(pages[0], id)).toMatchObject({ display: '', ariaHidden: null });
  await both(pages, page => run(page, id, [{ op: 'hide' }, { op: 'show', value: 0 }]));
  expect(await barState(pages[0], id)).toMatchObject(hiddenState);
  await context.clock.fastForward(0);
  await equalState(pages, 'show(0) fired');
  expect(await barState(pages[0], id)).toMatchObject({ display: '', ariaHidden: null });

  // hide() cancels a pending delayed show.
  await both(pages, page => run(page, id, [{ op: 'show', value: 500 }, { op: 'hide' }]));
  await context.clock.fastForward(500);
  await equalState(pages, 'hide() cancels show(500)');
  expect(await barState(pages[0], id)).toMatchObject(hiddenState);

  // Declarative visibility uses the same calls.
  await both(pages, page => setProps(page, id, { visible: true, showDelay: 400 }));
  expect(await barState(pages[0], id)).toMatchObject(hiddenState);
  await context.clock.fastForward(400);
  await equalState(pages, 'visible + showDelay');
  expect(await barState(pages[0], id)).toMatchObject({ display: '', ariaHidden: null });
  await both(pages, page => setProps(page, id, { visible: false }));
  await equalState(pages, 'visible false');
  expect(await barState(pages[0], id)).toMatchObject(hiddenState);

  // `visible` is symmetric: a bar hidden by the prop comes back when it turns true again.
  const roundTrip = 'hidden';
  expect(await barState(pages[0], roundTrip)).toMatchObject(hiddenState);
  await both(pages, page => setProps(page, roundTrip, { visible: true }));
  await equalState(pages, 'visible true again');
  expect(await barState(pages[0], roundTrip)).toMatchObject({ display: '', ariaHidden: null });
  expect(errors).toEqual([]);
});

test('ProgressBar worked()/setWorked()/total()/hasTotal() arithmetic matches the original', async ({ context }) => {
  const { pages, errors } = await pair(context, 'dark');
  const id = 'worked-without-total';

  // worked() accumulates; total() resets the accumulation and sets aria-valuemax.
  await both(pages, page => run(page, id, [{ op: 'total', value: 100 }]));
  await equalState(pages, 'total(100)');
  expect(await barState(pages[0], id)).toMatchObject({ ariaValueMax: '100', hasTotal: true });
  // Math.max(1, Number(value)): 0 and negative increments still advance by one unit.
  await both(pages, page => run(page, id, [{ op: 'worked', value: 0 }]));
  await equalState(pages, 'worked(0)');
  expect(await barState(pages[0], id)).toMatchObject({ ariaValueNow: '1' });
  expect((await barState(pages[0], id)).bit.width).toBe('1%');
  await both(pages, page => run(page, id, [{ op: 'worked', value: -5 }]));
  await equalState(pages, 'worked(-5)');
  expect(await barState(pages[0], id)).toMatchObject({ ariaValueNow: '2' });
  expect((await barState(pages[0], id)).bit.width).toBe('2%');
  await both(pages, page => run(page, id, [{ op: 'worked', value: 49 }]));
  await equalState(pages, 'worked(49)');
  expect(await barState(pages[0], id)).toMatchObject({ ariaValueNow: '51' });
  expect((await barState(pages[0], id)).bit.width).toBe('51%');

  // setWorked() is absolute: the width clamps to the total, aria-valuenow keeps the raw value.
  await both(pages, page => run(page, id, [{ op: 'setWorked', value: 0 }]));
  await equalState(pages, 'setWorked(0)');
  expect(await barState(pages[0], id)).toMatchObject({ ariaValueNow: '1' });
  expect((await barState(pages[0], id)).bit.width).toBe('1%');
  await both(pages, page => run(page, id, [{ op: 'setWorked', value: 1000 }]));
  await equalState(pages, 'setWorked(1000)');
  expect(await barState(pages[0], id)).toMatchObject({ ariaValueNow: '1000' });
  expect((await barState(pages[0], id)).bit.width).toBe('100%');

  // total() re-scales the bar for the newly announced amount of work.
  await both(pages, page => run(page, 'determinate-half', [{ op: 'total', value: 50 }, { op: 'worked', value: 10 }]));
  await equalState(pages, 'total(50), worked(10)');
  expect(await barState(pages[0], 'determinate-half')).toMatchObject({ ariaValueMax: '50', ariaValueNow: '10', hasTotal: true });
  expect((await barState(pages[0], 'determinate-half')).bit.width).toBe('20%');

  // total(0) is a number (hasTotal() true) but the 0-100 fallback still scales the bit.
  await both(pages, page => run(page, id, [{ op: 'total', value: 0 }, { op: 'worked', value: 30 }]));
  await equalState(pages, 'total(0)');
  expect(await barState(pages[0], id)).toMatchObject({ ariaValueMax: '0', ariaValueNow: '30', hasTotal: true });
  expect((await barState(pages[0], id)).bit.width).toBe('30%');

  // stop() drops the total.
  await both(pages, page => run(page, id, [{ op: 'stop' }]));
  await equalState(pages, 'stop clears total');
  expect(await barState(pages[0], id)).toMatchObject({ hasTotal: false });
  expect(errors).toEqual([]);
});

test('ProgressBar declarative updates match the original call sequence', async ({ context }, info) => {
  const { pages, errors } = await pair(context, 'dark');
  // total/worked are re-applied in a fixed order, exactly like the imperative calls.
  await both(pages, page => setProps(page, 'determinate-half', { total: 80, worked: 60 }));
  await equalState(pages, 'props total/worked');
  expect(await barState(pages[0], 'determinate-half')).toMatchObject({ ariaValueMax: '80', ariaValueNow: '60' });
  expect((await barState(pages[0], 'determinate-half')).bit.width).toBe('75%');
  await pixels(pages, info, 'props-discrete', { target: row('determinate-half') });

  await both(pages, page => setProps(page, 'determinate-half', { infinite: true }));
  await equalState(pages, 'props infinite');
  expect(ids(await barState(pages[0], 'determinate-half'))).toEqual(['active', 'infinite']);
  expect((await barState(pages[0], 'determinate-half')).bit).toMatchObject({ width: '2%', opacity: '1' });
  await pixels(pages, info, 'props-infinite', { target: row('determinate-half') });

  await both(pages, page => setProps(page, 'determinate-half', { infinite: false, worked: 20 }));
  await equalState(pages, 'props infinite to discrete');
  expect(ids(await barState(pages[0], 'determinate-half'))).toEqual(['active', 'discrete']);
  expect((await barState(pages[0], 'determinate-half')).bit.width).toBe('25%');
  await pixels(pages, info, 'props-back-to-discrete', { target: row('determinate-half') });

  // infinite -> false without work information is the declarative end of an indeterminate bar.
  await both(pages, page => setProps(page, 'done-infinite', { infinite: false }));
  await equalState(pages, 'props infinite stop');
  expect(ids(await barState(pages[0], 'done-infinite'))).toEqual(['done']);
  expect(await barState(pages[0], 'done-infinite')).toMatchObject({ hasTotal: false });
  expect((await barState(pages[0], 'done-infinite')).bit.display).toBe('none');

  // Stopping an indeterminate bar must still apply visibility in the same update.
  await both(pages, page => setProps(page, 'infinite', { infinite: false, visible: false }));
  await equalState(pages, 'stop and hide together');
  for (const page of pages) expect(await barState(page, 'infinite')).toMatchObject({ display: 'none', ariaHidden: 'true', hasTotal: false });
  await both(pages, page => setProps(page, 'infinite', { infinite: true, visible: false }));
  await both(pages, page => setProps(page, 'infinite', { infinite: false, visible: true }));
  await equalState(pages, 'stop and reveal together');
  for (const page of pages) expect(await barState(page, 'infinite')).toMatchObject({ display: '', ariaHidden: null, hasTotal: false });

  // Dropping `total` simply stops calling total(); the last aria-valuemax and scale stay.
  await both(pages, page => setProps(page, 'determinate-full', { total: undefined, worked: 30 }));
  await equalState(pages, 'props without total');
  expect(await barState(pages[0], 'determinate-full')).toMatchObject({ ariaValueMax: '50', ariaValueNow: '30', hasTotal: true });
  expect((await barState(pages[0], 'determinate-full')).bit.width).toBe('60%');
  expect(errors).toEqual([]);
});

test('ProgressBar background follows progressBar.background and falls back to #0E70C0', async ({ context }) => {
  const { pages, errors } = await pair(context, 'hcDark');
  const background = (page: Page, id: string) => barState(page, id).then(state => state.bit.backgroundColor);
  // Both shipped theme layers supply the registered HC color without test injection.
  for (const page of pages) expect(await background(page, 'infinite')).toBe('rgb(111, 195, 223)');
  // Explicitly clear the token to test the component's unthemed fallback.
  await pages[1].locator('.vc-theme').evaluate(element => (element as HTMLElement).style.setProperty('--vscode-progressBar-background', 'initial'));
  expect(await background(pages[1], 'infinite')).toBe('rgb(14, 112, 192)');
  // The original always passes defaultProgressBarStyles, so a missing variable resolves to transparent.
  await pages[0].evaluate(() => document.getElementById('fixture')!.style.removeProperty('--vscode-progressBar-background'));
  expect(await background(pages[0], 'infinite')).toBe('rgba(0, 0, 0, 0)');
  // With the variable both implementations use the theme colour (hcDark: #6fc3df).
  await pages[0].evaluate(() => document.getElementById('fixture')!.style.setProperty('--vscode-progressBar-background', '#6fc3df'));
  await pages[1].locator('.vc-theme').evaluate(element => (element as HTMLElement).style.removeProperty('--vscode-progressBar-background'));
  expect(await background(pages[0], 'infinite')).toBe('rgb(111, 195, 223)');
  expect(await background(pages[1], 'infinite')).toBe('rgb(111, 195, 223)');
  expect(errors).toEqual([]);
});

test('ProgressBar cancels its timers on unmount and leaves no callbacks behind', async ({ context }) => {
  const { pages, errors } = await pair(context, 'dark', { clock: true });
  const [fixture, page] = pages;

  // Probe every timer the component creates from here on.
  await page.evaluate(() => {
    const realSetTimeout = window.setTimeout.bind(window), realClearTimeout = window.clearTimeout.bind(window);
    const pending = new Set<number>();
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const id = realSetTimeout(handler as never, timeout, ...args);
      pending.add(id);
      return id;
    }) as typeof window.setTimeout;
    window.clearTimeout = ((id?: number) => { pending.delete(id as number); return realClearTimeout(id); }) as typeof window.clearTimeout;
    (window as any).__timerProbe = { pending: () => [...pending] };
  });
  const created = await page.evaluate(async (indices: { infinite: number; done: number; delayed: number }) => {
    const probe = (window as any).__timerProbe, fixtureApi = window as any;
    const added: number[] = [];
    const track = async (action: () => unknown) => {
      const before = new Set<number>(probe.pending());
      await action();
      for (const id of probe.pending()) if (!before.has(id)) added.push(id);
    };
    // 10s long-running switch, 200ms done() cleanup and a delayed show.
    await track(() => fixtureApi.fixtureRun(indices.infinite, [{ op: 'infinite' }]));
    await track(() => fixtureApi.fixtureRun(indices.done, [{ op: 'done' }]));
    await track(() => fixtureApi.fixtureSet(indices.delayed, { visible: true, showDelay: 5000 }));
    return added;
  }, { infinite: progressBarIndex['infinite-long-running'], done: progressBarIndex['done-discrete'], delayed: progressBarIndex['delayed-show'] });
  expect(created, 'component timers created by the driver').toHaveLength(3);

  await page.evaluate(() => (window as any).fixtureUnmount());
  const left = await page.evaluate((created: number[]) => (window as any).__timerProbe.pending().filter((id: number) => created.includes(id)), created);
  expect(left, 'timers still pending after unmount').toEqual([]);
  expect(await page.locator('[data-testid="specimen"] [data-index]').count()).toBe(0);

  // Advancing past every deadline must not run a leftover callback or schedule a new timer.
  const before = await page.evaluate(() => (window as any).__timerProbe.pending());
  await context.clock.fastForward(20000);
  const after = await page.evaluate(() => (window as any).__timerProbe.pending());
  expect(after.filter((id: number) => !before.includes(id)), 'timers created by leftover callbacks').toEqual([]);
  expect(await page.locator('[data-testid="specimen"] [data-index]').count()).toBe(0);
  expect(errors).toEqual([]);

  // Mounting again starts from a clean state.
  await page.evaluate(async () => { (window as any).fixtureMount(); await Promise.resolve(); });
  await expect.poll(() => page.locator('[data-testid="specimen"] [data-index]').count()).toBe(14);
  expect(ids(await barState(page, 'after-stop'))).toEqual(['done']);

  // Documented deviation: the original keeps the untracked 200ms `done()` timer, which still runs
  // after the container was removed. The replica cancels it on unmount instead.
  await fixture.evaluate((index: number) => {
    const api = (window as any).fixtureBars[index];
    api.done();
    (api.getContainer() as HTMLElement).remove();
  }, progressBarIndex['done-discrete']);
  const detachedClass = (index: number) => fixture.evaluate((index: number) => (window as any).fixtureBars[index].getContainer().className, index);
  expect(await detachedClass(progressBarIndex['done-discrete'])).toContain('active');
  await context.clock.fastForward(200);
  expect(await detachedClass(progressBarIndex['done-discrete']), 'original cleanup runs on the detached element').toBe('monaco-progress-container done');
  expect(errors).toEqual([]);
});
