import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=toggle&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-toggle--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
const toggle = (page: Page, index = 0) => page.locator(`[data-index="${index}"] [role="checkbox"]`);
// Compare the full initial form, then crop each interaction to the row whose state changed.
async function pixels(pages: Page[], info: TestInfo, name: string, index?: number) {
  const buffers = [];
  for (const page of pages) { await page.bringToFront(); buffers.push(await (index === undefined ? page.getByTestId('specimen') : page.locator(`[data-index="${index}"]`)).screenshot({ animations: 'disabled' })); }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect({ width: a.width, height: a.height }).toEqual({ width: b.width, height: b.height });
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
}
async function state(page: Page) { return page.evaluate(() => { const { values, changes, keys, bubbled } = (window as any).fixtureState; return { values, changes, keys, bubbled }; }); }
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Toggle visual parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, 'initial');
    for (const page of pages) await toggle(page).hover();
    await pixels(pages, info, 'hover', 0);
    for (const page of pages) { await page.mouse.move(400, 400); await toggle(page).focus(); }
    await pixels(pages, info, 'keyboard-focus', 0);
    for (const page of pages) await page.keyboard.press('Space');
    await pixels(pages, info, 'checked-focus', 0);
    for (const page of pages) { await page.locator('.outside').click(); await toggle(page, 1).hover(); }
    await pixels(pages, info, 'checked-hover', 1);
    for (const page of pages) await toggle(page, 5).click();
    await pixels(pages, info, 'toolbar-checked', 5);
    for (const page of pages) { await page.keyboard.press('Tab'); await expect(toggle(page, 6)).toBeFocused(); }
    await pixels(pages, info, 'toolbar-focus', 6);
  });
}
test('Toggle title, modifiers, event timing, disabled state, tab order and toolbar composition match original', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await expect(toggle(page, 4)).toHaveAttribute('aria-label', 'regex  Empty toggle');
    await expect(toggle(page, 4)).not.toHaveAttribute('tabindex');
    await expect(toggle(page)).not.toHaveAttribute('title');
    await toggle(page).click();
    await page.keyboard.down('Space');
    await expect(toggle(page)).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.up('Space');
    await expect(toggle(page)).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Shift+Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(toggle(page)).toBeFocused();
    await toggle(page, 2).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight');
    await expect(toggle(page, 2)).toHaveAttribute('aria-checked', 'false');
    await expect(toggle(page, 2)).toHaveAttribute('tabindex', '-1');
    await toggle(page, 4).click();
    await expect(toggle(page, 4)).not.toBeFocused();
    await toggle(page, 0).focus();
    await page.keyboard.press('Tab');
    await expect(toggle(page, 1)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(toggle(page, 5)).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await expect(toggle(page, 6)).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(toggle(page, 7)).toBeFocused();
    await page.keyboard.press('Space');
  }
  const expected = { values: [false, true, false, true, true, true, false, true], changes: [
    { index: 0, checked: true, viaKeyboard: false }, { index: 0, checked: false, viaKeyboard: true },
    { index: 0, checked: true, viaKeyboard: true }, { index: 0, checked: false, viaKeyboard: true },
    { index: 4, checked: true, viaKeyboard: false }, { index: 5, checked: true, viaKeyboard: true },
    { index: 6, checked: false, viaKeyboard: true }, { index: 7, checked: true, viaKeyboard: true },
  ], keys: ['Shift', 'ArrowRight', 'Escape', 'Tab', 'Tab', 'Tab', 'Tab'], bubbled: 0 };
  expect(await state(pages[0])).toEqual(expected);
  expect(await state(pages[1])).toEqual(expected);
});
