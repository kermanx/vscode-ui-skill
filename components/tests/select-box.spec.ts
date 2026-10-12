import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=select-box&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-select-box--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
async function equalPixels(pages: Page[], info: TestInfo, name: string, popup = false) {
  const buffers: Buffer[] = [];
  for (const page of pages) {
    await page.bringToFront(); await expect(page.locator('vite-error-overlay')).toHaveCount(0); await page.mouse.move(410, 470);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    buffers.push(await (popup ? page.locator('.monaco-select-box-dropdown-container.visible') : page.getByTestId('specimen')).screenshot({ animations: 'disabled' }));
  }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  if (a.width !== b.width || a.height !== b.height) {
    await info.attach(`${name}-original`, { body: buffers[0], contentType: 'image/png' });
    await info.attach(`${name}-replica`, { body: buffers[1], contentType: 'image/png' });
  }
  expect([b.width, b.height], `${name} dimensions`).toEqual([a.width, a.height]);
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) {
    await info.attach(`${name}-original`, { body: buffers[0], contentType: 'image/png' });
    await info.attach(`${name}-replica`, { body: buffers[1], contentType: 'image/png' });
    await info.attach(`${name}-diff`, { body: PNG.sync.write(diff), contentType: 'image/png' });
  }
  expect(count, `${name} differing pixels`).toBe(0);
}
const trigger = (page: Page, index: number) => page.getByTestId('specimen').locator(`[data-index="${index}"] select`);
async function equalState(pages: Page[]) {
  const states = await Promise.all(pages.map(page => page.evaluate(() => {
    const { selections, events } = (window as any).fixtureState;
    return { selections, events, selected: [...document.querySelectorAll('select')].map(select => select.selectedIndex), focused: document.querySelector('.monaco-list-row.focused')?.getAttribute('data-index'), expanded: [...document.querySelectorAll('select')].map(select => select.getAttribute('aria-expanded')) };
  })));
  expect(states[1]).toEqual(states[0]);
}
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`SelectBox native/custom appearance and descriptions / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await equalPixels(pages, info, 'closed');
    for (const page of pages) await trigger(page, 0).focus();
    await equalPixels(pages, info, 'native-focus');
    for (const page of pages) await trigger(page, 1).click();
    await equalPixels(pages, info, 'custom-open', true);
    for (const page of pages) await page.keyboard.press('ArrowDown');
    await equalState(pages); await equalPixels(pages, info, 'detail', true);
    for (const page of pages) await page.keyboard.press('Escape');
    await equalPixels(pages, info, 'custom-cancel');
    for (const page of pages) await trigger(page, 4).click();
    await equalPixels(pages, info, 'toolbar-menu', true);
  });
}
test('SelectBox selection, disabled options, separator, prefix, acceptance and cancel', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) { await trigger(page, 0).selectOption({ index: 4 }); await trigger(page, 1).focus(); await page.keyboard.press('Enter'); }
  for (const key of ['ArrowDown', 'ArrowDown', 'End', 'Home', 'j', 'j', 'm', 'Escape']) {
    for (const page of pages) await page.keyboard.press(key);
    await equalState(pages);
  }
  for (const page of pages) { await page.keyboard.press('Enter'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Tab'); await expect(trigger(page, 1)).toBeFocused(); }
  await equalState(pages);
  for (const page of pages) { await trigger(page, 1).click(); await page.locator('.monaco-list-row').filter({ hasText: 'Unavailable language' }).click(); await expect(page.getByRole('listbox')).toBeVisible(); }
  await equalState(pages);
  for (const page of pages) { await page.locator('.monaco-list-row').filter({ hasText: 'Markdown' }).click(); await expect(trigger(page, 1)).toBeFocused(); }
  await equalState(pages);
  for (const page of pages) { await trigger(page, 1).click(); await page.locator('.monaco-list-row').filter({ hasText: 'Plain Text' }).hover(); }
  await equalState(pages);
  for (const page of pages) await page.keyboard.press('Enter');
  await equalState(pages);
  for (const page of pages) { await trigger(page, 1).click(); await page.keyboard.press('ArrowDown'); await page.getByText('Move focus outside').click(); }
  await equalState(pages);
  for (const page of pages) { await expect(trigger(page, 2)).toBeDisabled(); await trigger(page, 3).click(); }
  await equalPixels(pages, info, 'hide-disabled', true);
  for (const page of pages) { await page.keyboard.press('Escape'); await trigger(page, 1).dispatchEvent('touchstart'); await trigger(page, 1).dispatchEvent('touchend'); }
  await equalState(pages);
  for (const page of pages) { await trigger(page, 1).dispatchEvent('touchstart'); await trigger(page, 1).dispatchEvent('touchend'); }
  await equalState(pages);
});
test('SelectBox scrolling, page navigation and constrained positioning', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) await trigger(page, 5).click();
  await equalPixels(pages, info, 'scroll-menu', true);
  for (const key of ['PageDown', 'PageDown', 'PageUp', 'End', 'Home']) {
    for (const page of pages) await page.keyboard.press(key);
    await equalState(pages); await equalPixels(pages, info, key, true);
  }
  for (const page of pages) { await page.getByRole('listbox').hover(); await page.mouse.wheel(0, 140); }
  await equalPixels(pages, info, 'wheel-scroll', true);
  for (const page of pages) { await page.keyboard.press('Escape'); await page.setViewportSize({ width: 240, height: 440 }); await trigger(page, 6).click(); }
  await equalPixels(pages, info, 'above-narrow', true);
  const bounds = await Promise.all(pages.map(page => page.locator('.monaco-select-box-dropdown-container.visible').boundingBox()));
  expect(bounds[1]).toEqual(bounds[0]);
  for (const page of pages) { await page.keyboard.press('Escape'); await page.setViewportSize({ width: 260, height: 480 }); await trigger(page, 7).click(); }
  await equalPixels(pages, info, 'wide-menu', true);
  const wideBounds = await Promise.all(pages.map(page => page.locator('.monaco-select-box-dropdown-container.visible').boundingBox()));
  expect(wideBounds[1]).toEqual(wideBounds[0]);
  expect(wideBounds[0]!.x).toBeLessThan(20);
});
