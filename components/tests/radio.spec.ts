import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=radio&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-radio--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
const group = (page: Page, index = 0) => page.locator(`[data-index="${index}"] [role="radiogroup"]`);
const option = (page: Page, groupIndex = 0, index = 0) => group(page, groupIndex).getByRole('radio').nth(index);
// Compare the full initial form, then crop each interaction to the row whose state changed.
async function pixels(pages: Page[], info: TestInfo, name: string, index?: number) {
  const buffers = [];
  for (const page of pages) { await page.bringToFront(); await page.evaluate(async () => { await new Promise(requestAnimationFrame); await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))); }); buffers.push(await (index === undefined ? page.getByTestId('specimen') : page.locator(`[data-index="${index}"]`)).screenshot({ animations: 'disabled' })); }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect({ width: a.width, height: a.height }).toEqual({ width: b.width, height: b.height });
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
}
async function state(page: Page) { return page.evaluate(() => { const { values, selections, activations } = (window as any).fixtureState; return { values, selections, activations }; }); }
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Radio visual parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    for (const page of pages) await expect(group(page, 4)).toHaveClass(/selection-indicator-ready/);
    await pixels(pages, info, 'initial');
    for (const page of pages) await option(page, 0, 1).hover();
    await pixels(pages, info, 'inactive-hover', 0);
    for (const page of pages) { await page.mouse.move(400, 450); await option(page).focus(); }
    await pixels(pages, info, 'focus', 0);
    for (const page of pages) await page.keyboard.press('ArrowRight');
    await pixels(pages, info, 'selected-focus', 0);
    for (const page of pages) { await option(page, 4, 2).click(); await page.mouse.move(400, 450); }
    await pixels(pages, info, 'segmented-selected', 4);
    for (const page of pages) { await option(page, 5).focus(); await page.keyboard.press('ArrowRight'); }
    await pixels(pages, info, 'segmented-focus-only', 5);
    for (const page of pages) await page.keyboard.press('Space');
    await pixels(pages, info, 'segmented-activated', 5);
  });
}
test('Radio arrow wrapping, disabled skips, focus-only navigation and separate select/activate events', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await expect(group(page)).toHaveAttribute('aria-label', 'Wrapping');
    await expect(option(page, 1, 0)).toHaveAttribute('aria-label', 'List view');
    await expect(option(page, 1, 1)).toHaveAttribute('aria-label', 'Tree view');
    await option(page).click();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Shift+Space');
    await page.keyboard.press('ArrowRight');
    await expect(option(page, 0, 1)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(option(page, 0, 0)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(option(page, 0, 1)).toBeFocused();
    await option(page, 0, 2).click({ force: true });
    await expect(option(page, 0, 2)).toHaveAttribute('aria-checked', 'false');
    await option(page, 2).focus();
    await page.keyboard.press('ArrowRight');
    await expect(option(page, 2, 2)).toBeFocused();
    await expect(option(page, 2, 0)).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.down('Space');
    await expect(option(page, 2, 2)).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.up('Space');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(option(page, 2, 2)).not.toBeFocused();
    await option(page, 3, 1).focus();
    await page.keyboard.press('Enter');
    // The original skips item-level disabled flags for arrows, not setEnabled(false).
    await page.keyboard.press('ArrowLeft');
    await expect(option(page, 3, 0)).toBeFocused();
    await expect(option(page, 3, 0)).toHaveAttribute('aria-checked', 'true');
  }
  expect(await state(pages[0])).toEqual({ values: [1, 1, 2, 0, 1, 0, 0], selections: [
    { group: 0, index: 1 }, { group: 0, index: 0 }, { group: 0, index: 1 }, { group: 2, index: 2 }, { group: 3, index: 0 },
  ], activations: [{ group: 0, index: 0 }, { group: 0, index: 0 }, { group: 2, index: 2 }, { group: 2, index: 2 }] });
  expect(await state(pages[1])).toEqual(await state(pages[0]));
});
test('Radio dynamic options, external selection, enable state and segmented resize match original', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.locator('.fixture-replace').click();
    await expect(group(page, 6).getByRole('radio')).toHaveCount(3);
    await expect(option(page, 6, 2)).toHaveAttribute('aria-checked', 'true');
    await page.locator('.fixture-select').click();
    await expect(option(page, 6, 0)).toHaveAttribute('aria-checked', 'true');
    await page.locator('.fixture-enable').click();
    await option(page, 3, 0).click();
    await expect(option(page, 3, 0)).toHaveAttribute('aria-disabled', 'false');
    await page.locator('.outside').click();
    await page.setViewportSize({ width: 300, height: 480 });
  }
  await pixels(pages, info, 'dynamic-options', 6);
  await pixels(pages, info, 'segmented-resize', 4);
  expect(await state(pages[0])).toEqual({ values: [0, 1, 0, 0, 1, 0, 0], selections: [{ group: 3, index: 0 }], activations: [{ group: 3, index: 0 }] });
  expect(await state(pages[1])).toEqual(await state(pages[0]));
});
test('Radio segmented indicator settles after interrupted selection and respects reduced motion', async ({ context }, info) => {
  const pages = await pair(context);
  const transitions: string[] = [];
  for (const page of pages) {
    await option(page, 4, 2).click();
    transitions.push(await group(page, 4).locator('.monaco-radio-selection').evaluate(element => getComputedStyle(element).transition));
    await option(page, 4, 0).click();
    await option(page, 4, 1).click();
    await page.mouse.move(400, 450);
  }
  expect(transitions[1]).toEqual(transitions[0]);
  await pixels(pages, info, 'interrupted-selection', 4);
  for (const page of pages) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await option(page, 4, 1).focus();
    await page.keyboard.press('ArrowRight');
    await expect(option(page, 4, 2)).toBeFocused();
    expect(await group(page, 4).locator('.monaco-radio-selection').evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
  }
  await pixels(pages, info, 'reduced-motion', 4);
  expect(await state(pages[1])).toEqual(await state(pages[0]));
});
