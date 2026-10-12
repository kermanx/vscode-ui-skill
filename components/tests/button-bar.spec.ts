import { settleFixturePaint } from './paint';
import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=button-bar&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-button-bar--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
const bar = (page: Page, index = 0) => page.locator(`[data-index="${index}"]`);
const button = (page: Page, group = 0, index = 0) => bar(page, group).locator(':scope > .monaco-button, :scope > .monaco-description-button > .monaco-button, :scope > .monaco-button-dropdown > .monaco-text-button').nth(index);
const arrow = (page: Page) => bar(page, 1).locator('.monaco-dropdown-button');
// Paint both complete fixtures from the same final state, including every focus outline.
async function pixels(pages: Page[], info: TestInfo, name: string) {
  const buffers = [];
  for (const page of pages) {
    await page.bringToFront();
    await settleFixturePaint(page);
    buffers.push(await page.getByTestId('specimen').screenshot({ animations: 'disabled' }));
  }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect({ width: a.width, height: a.height }).toEqual({ width: b.width, height: b.height });
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
}
async function state(page: Page) { return page.evaluate(() => { const { clicks, actions } = (window as any).fixtureState; return { clicks, actions }; }); }
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`ButtonBar visual parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, 'initial');
    for (const page of pages) await button(page).hover();
    await pixels(pages, info, 'hover');
    for (const page of pages) { await page.mouse.move(400, 450); await button(page).focus(); }
    await pixels(pages, info, 'focus');
    for (const page of pages) { await button(page).focus(); await page.keyboard.press('ArrowRight'); await expect(button(page, 0, 1)).toBeFocused(); }
    await pixels(pages, info, 'disabled-focus');
    for (const page of pages) { await button(page, 2).focus(); await page.keyboard.press('ArrowDown'); await expect(button(page, 2, 1)).toBeFocused(); }
    await pixels(pages, info, 'description-focus');
    for (const page of pages) { await arrow(page).focus(); await page.keyboard.press('ArrowRight'); await expect(button(page, 1, 1)).toBeFocused(); }
    await pixels(pages, info, 'dropdown-composition');
  });
}
test('ButtonBar cycles on its alignment keys, includes disabled buttons, and preserves button activation', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await button(page).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(button(page, 0, 2)).toBeFocused();
    await page.keyboard.press('Shift+ArrowRight');
    await expect(button(page, 0, 2)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(button(page, 0, 0)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(button(page, 0, 1)).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await expect(button(page, 0, 2)).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await button(page, 2).focus();
    await page.keyboard.press('ArrowRight');
    await expect(button(page, 2)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(button(page, 2, 1)).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await expect(button(page, 2)).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');
    await expect(button(page, 2)).not.toBeFocused();
  }
  expect(await state(pages[0])).toEqual({ clicks: ['cancel', 'save', 'later', 'install'], actions: [] });
  expect(await state(pages[1])).toEqual(await state(pages[0]));
});
test('ButtonBar dropdown primary and arrow participate in the bar while the menu keeps its own keyboard handling', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await button(page, 1).focus();
    await page.keyboard.press('ArrowRight');
    await expect(button(page, 1, 1)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(button(page, 1)).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(arrow(page)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(button(page, 1, 1)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Open in New Window' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(arrow(page)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(button(page, 1, 1)).toBeFocused();
  }
  expect(await state(pages[0])).toEqual({ clicks: ['open'], actions: ['open:new-window'] });
  expect(await state(pages[1])).toEqual(await state(pages[0]));
});
