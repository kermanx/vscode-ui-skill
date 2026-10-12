import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=input-box&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-input-box--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
// Actions focus is checked on its entire input row; unrelated validation rows have
// dedicated full-canvas tests, avoiding unrelated rounded-border repaint noise.
async function equalPixels(pages: Page[], info: TestInfo, name: string, keepPointer = false) {
  const images: Buffer[] = [];
  for (const page of pages) { await page.bringToFront(); if (!keepPointer) await page.mouse.move(415, 470); await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); const target = name === 'actions-focus' ? page.locator('[data-index="9"]') : page.getByTestId('specimen'); images.push(await target.screenshot({ animations: 'disabled', caret: 'hide' })); }
  const [a, b] = images.map(image => PNG.sync.read(image));
  expect([b.width, b.height]).toEqual([a.width, a.height]);
  const diff = new PNG({ width: a.width, height: a.height });
  const pixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (pixels) {
    await info.attach(`${name}-original`, { body: images[0], contentType: 'image/png' });
    await info.attach(`${name}-replica`, { body: images[1], contentType: 'image/png' });
    await info.attach(`${name}-diff`, { body: PNG.sync.write(diff), contentType: 'image/png' });
  }
  expect(pixels, `${name} differing pixels`).toBe(0);
}
const field = (page: Page, index: number) => page.locator(`[data-index="${index}"] input`);
async function equalState(pages: Page[]) {
  const states = await Promise.all(pages.map(page => page.evaluate(() => { const { values, changes, actions } = (window as any).fixtureState; return { values, changes, actions }; })));
  expect(states[1]).toEqual(states[0]);
}
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`InputBox appearance, focus and validation / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await equalPixels(pages, info, 'default');
    for (const index of [0, 2, 3, 5, 6, 7, 8]) {
      for (const page of pages) await field(page, index).focus();
      await equalPixels(pages, info, `focus-${index}`);
      if (index >= 6) {
        const messages = await Promise.all(pages.map(page => page.locator('.monaco-inputbox-message').evaluate(el => ({ text: el.textContent, rect: JSON.stringify(el.getBoundingClientRect()), bg: getComputedStyle(el).backgroundColor }))));
        expect(messages[1]).toEqual(messages[0]);
      }
    }
    for (const page of pages) await page.getByText('Move focus outside').click();
    await equalPixels(pages, info, 'blur');
    for (const page of pages) await page.getByRole('button', { name: 'Clear input', exact: true }).hover();
    await equalPixels(pages, info, 'action-hover', true);
  });
}
test('InputBox editing, selection, disabled, history, actions and validation', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await field(page, 0).fill('search text');
    await page.evaluate(() => (window as any).fixtureInputs[0].select({ start: 2, end: 6 }));
    expect(await field(page, 0).evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd])).toEqual([2, 6]);
    await page.keyboard.type('X');
    await field(page, 3).focus(); await page.keyboard.type('ignored');
    expect(await field(page, 3).inputValue()).toBe('/workspace/project');
    await expect(field(page, 4)).toBeDisabled();
    await field(page, 8).fill('demo@example.com');
    await expect(field(page, 8)).not.toHaveAttribute('aria-invalid');
    await field(page, 8).fill('invalid');
    await expect(field(page, 8)).toHaveAttribute('aria-invalid', 'true');
    await field(page, 9).focus();
  }
  await equalState(pages);
  await equalPixels(pages, info, 'history-placeholder');
  for (const key of ['ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowDown']) {
    for (const page of pages) await page.keyboard.press(key);
    await equalState(pages);
  }
  for (const page of pages) { await field(page, 9).fill('draft'); await page.keyboard.press('ArrowUp'); }
  await equalState(pages);
  for (const page of pages) { await page.keyboard.press('ArrowDown'); await page.getByRole('button', { name: 'Clear input', exact: true }).click(); }
  await equalState(pages);
  for (const page of pages) {
    await page.getByRole('button', { name: 'Clear input', exact: true }).focus();
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space');
  }
  await equalState(pages);
  await equalPixels(pages, info, 'actions-focus');
});
test('InputBox validation follows container resizing', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await field(page, 6).focus();
    await page.locator('[data-index="6"]').evaluate((el: HTMLElement) => el.style.width = '200px');
    await expect.poll(() => page.locator('.monaco-inputbox-container').evaluate(el => el.getBoundingClientRect().width)).toBe(200);
  }
});
test('HistoryInputBox restores the hint after clearing a blurred input', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await field(page, 9).fill('draft');
    await page.getByText('Move focus outside').click();
    await expect(field(page, 9)).toHaveAttribute('placeholder', 'Find');
    await page.getByRole('button', { name: 'Clear input', exact: true }).click();
    await expect(field(page, 9)).not.toBeFocused();
    await expect(field(page, 9)).toHaveAttribute('placeholder', 'Find (⇅ for history)');
    await field(page, 9).focus();
    await page.getByText('Move focus outside').click();
    await expect(field(page, 9)).toHaveAttribute('placeholder', 'Find');
  }
  await equalState(pages);
});
