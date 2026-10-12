import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=switch&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-switch--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
const control = (page: Page, index = 0) => page.locator(`[data-index="${index}"] [role="switch"]`);
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
async function state(page: Page) { return page.evaluate(() => { const { values, changes, bubbled, submits } = (window as any).fixtureState; return { values, changes, bubbled, submits }; }); }
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Switch visual parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, 'initial');
    for (const page of pages) await control(page).hover();
    await pixels(pages, info, 'hover', 0);
    for (const page of pages) { await page.mouse.move(400, 450); await control(page).focus(); }
    await pixels(pages, info, 'keyboard-focus', 0);
    for (const page of pages) await page.keyboard.press('Space');
    await pixels(pages, info, 'checked-focus', 0);
    for (const page of pages) { await control(page, 4).click(); await page.mouse.move(400, 450); }
    await pixels(pages, info, 'label-composition', 4);
    for (const page of pages) { await control(page, 1).click(); await page.mouse.move(400, 450); }
    await pixels(pages, info, 'unchecked-mouse-focus', 1);
  });
}
test('Switch native keyboard timing, disabled Tab behavior, label composition and form events match original', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await expect(control(page)).toHaveAttribute('type', 'button');
    await expect(control(page)).not.toHaveAttribute('title');
    await expect(control(page, 4)).toHaveAttribute('aria-description', 'Pick the best model for each request');
    await control(page).click();
    await page.keyboard.down('Space');
    await expect(control(page)).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.up('Space');
    await expect(control(page)).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.down('Enter');
    await expect(control(page)).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.up('Enter');
    await page.keyboard.press('Shift+Space');
    await page.keyboard.press('Escape');
    await expect(control(page)).toBeFocused();
    await control(page, 2).click({ force: true });
    await expect(control(page, 2)).toBeDisabled();
    await expect(control(page, 2)).toHaveAttribute('aria-checked', 'false');
    await control(page, 0).focus();
    await page.keyboard.press('Tab');
    await expect(control(page, 1)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(control(page, 4)).toBeFocused();
    await page.locator('[data-index="4"] span').click();
    await expect(control(page, 4)).toHaveAttribute('aria-checked', 'false');
    await control(page, 4).click();
    await page.keyboard.press('Tab');
    await expect(page.locator('.outside')).toBeFocused();
  }
  const expected = { values: [false, true, false, true, true, true], changes: [
    { index: 0, checked: true }, { index: 0, checked: false }, { index: 0, checked: true }, { index: 0, checked: false }, { index: 4, checked: true },
  ], bubbled: 1, submits: 0 };
  expect(await state(pages[0])).toEqual(expected);
  expect(await state(pages[1])).toEqual(expected);
});
test('Switch controlled properties update silently and reduced-motion host class removes transitions', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.locator('.fixture-update').click();
    await expect(control(page)).toHaveAttribute('aria-checked', 'true');
    await expect(control(page)).toHaveAttribute('aria-label', 'Updated setting');
    await expect(control(page, 2)).toBeEnabled();
    await control(page, 1).focus();
    await page.keyboard.press('Tab');
    await expect(control(page, 2)).toBeFocused();
    await page.locator('.outside').click();
    await page.getByTestId('specimen').evaluate(element => element.classList.add('monaco-reduce-motion'));
    await control(page, 0).click();
    expect(await control(page).evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
    expect(await control(page).locator('.monaco-switch-thumb').evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
    await page.mouse.move(400, 450);
  }
  await pixels(pages, info, 'controlled-and-reduced-motion');
  const expected = { values: [false, true, false, true, false, true], changes: [{ index: 0, checked: false }], bubbled: 0, submits: 0 };
  expect(await state(pages[0])).toEqual(expected);
  expect(await state(pages[1])).toEqual(expected);
});
for (const scale of [1.5, 2]) {
  test(`Switch thumb and track retain parity at device scale ${scale}`, async ({ browser }, info) => {
    const context = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:6006', viewport: { width: 420, height: 480 }, deviceScaleFactor: scale });
    try { const pages = await pair(context); await pixels(pages, info, `device-scale-${scale}`); } finally { await context.close(); }
  });
}
