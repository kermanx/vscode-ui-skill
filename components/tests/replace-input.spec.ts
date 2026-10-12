import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { settleFixturePaint } from './paint';
test.setTimeout(60000);
test.use({ viewport: { width: 420, height: 1050 } });
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=replace-input&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-replace-input--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.scrollbar.visible')).toHaveCount(0);
  }
  expect(errors).toEqual([]); return pages;
}
async function equalPixels(pages: Page[], info: TestInfo, name: string, index?: number, keepPointer = false) {
  const buffers: Buffer[] = [];
  for (const page of pages) {
    await page.bringToFront(); await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    if (!keepPointer) await page.mouse.move(415, 475);
    // Wait for the delayed tooltip so it cannot appear between the two screenshots.
    if (keepPointer && (name === 'option-hover' || name === 'hover'))
      await expect(page.locator('.monaco-hover:visible')).toBeVisible();
    await settleFixturePaint(page);
    buffers.push(await (index === undefined ? page.getByTestId('specimen') : page.locator(`[data-index="${index}"]`)).screenshot({ animations: 'disabled', caret: 'hide' }));
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
const field = (page: Page, index: number) => page.locator(`[data-index="${index}"]`).getByRole('textbox');
const option = (page: Page, index: number) => page.locator(`[data-index="${index}"] [data-option="preserve"]`);
async function equalState(pages: Page[]) {
  const states = await Promise.all(pages.map(page => page.evaluate(() => {
    const { values, preserves, changes, options, inputEvents, optionKeys } = (window as any).fixtureState;
    const active = document.activeElement as HTMLElement;
    return { values, preserves, changes, options, inputEvents, optionKeys,
      focused: active?.getAttribute('data-option') ?? active?.getAttribute('aria-label'), inputType: active?.tagName };
  })));
  expect(states[1]).toEqual(states[0]);
}
async function equalScroll(pages: Page[], index: number) {
  const states = await Promise.all(pages.map(page => page.locator(`[data-index="${index}"]`).evaluate(el => {
    const input = el.querySelector('textarea')!, slider = el.querySelector<HTMLElement>('.vertical .slider')!;
    return { height: input.clientHeight, scrollHeight: input.scrollHeight, top: input.scrollTop, sliderTop: slider.style.top, sliderHeight: slider.style.height };
  })));
  expect(states[1]).toEqual(states[0]);
}
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`ReplaceInput preserved case, history, capped multiline and composition / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await equalPixels(pages, info, 'default');
    for (const page of pages) await field(page, 0).focus();
    await equalPixels(pages, info, 'focus', 0);
    for (const page of pages) await option(page, 0).hover();
    await equalPixels(pages, info, 'hover', 0, true);
    for (const page of pages) await option(page, 0).click();
    await equalState(pages); await equalPixels(pages, info, 'preserve-click', 0);
    for (const page of pages) { await option(page, 4).focus(); await page.keyboard.press('Space'); }
    await equalState(pages); await equalPixels(pages, info, 'preserve-keyboard', 4);
    for (const page of pages) await field(page, 6).focus();
    const messages = await Promise.all(pages.map(page => page.locator('.monaco-inputbox-message').evaluate(el => ({ text: el.textContent, rect: el.getBoundingClientRect().toJSON() }))));
    expect(messages[1]).toEqual(messages[0]); await equalPixels(pages, info, 'validation');
    for (const page of pages) await field(page, 8).hover();
    await equalPixels(pages, info, 'capped-hover', 8, true);
    for (const page of pages) { await page.bringToFront(); await field(page, 8).hover(); await page.mouse.wheel(0, 60); }
    await equalScroll(pages, 8); await equalPixels(pages, info, 'capped-scroll', 8, true);
  });
}
test('ReplaceInput option keyboard events, refocus, disabled and hidden options', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) await option(page, 0).focus();
  for (const key of ['ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Escape']) {
    for (const page of pages) await page.keyboard.press(key);
    await equalState(pages);
  }
  for (const page of pages) {
    await option(page, 4).click(); await expect(option(page, 4)).toBeFocused();
    await option(page, 0).click(); await expect(field(page, 0)).toBeFocused();
    await expect(field(page, 2)).toBeDisabled(); await expect(option(page, 2)).toHaveAttribute('aria-disabled', 'true');
    await expect(option(page, 3)).toHaveAttribute('aria-checked', 'true'); await expect(option(page, 3)).toBeHidden();
    await field(page, 6).fill('available'); await expect(field(page, 6)).not.toHaveAttribute('aria-invalid');
  }
  await equalState(pages); await equalPixels(pages, info, 'valid-replacement', 6);
});
test('ReplaceInput history, multiline paste, insertion at cursor and selection', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) await field(page, 5).focus();
  for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown']) {
    for (const page of pages) await page.keyboard.press(key); await equalState(pages);
  }
  for (const text of ['One line', 'First\nSecond\n', '', 'left\nright']) {
    for (const page of pages) await field(page, 7).fill(text);
    await equalState(pages); await equalPixels(pages, info, 'multiline-paste', 7);
  }
  for (const page of pages) {
    await field(page, 7).evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(4, 5));
    await page.evaluate(async () => { const replacement = (window as any).fixtureReplaceInputs[7]; await (replacement.inputBox ?? replacement).insertAtCursor(' + '); });
    expect(await field(page, 7).inputValue()).toBe('left + right');
    expect(await field(page, 7).evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd])).toEqual([5, 5]);
  }
  await equalState(pages); await equalPixels(pages, info, 'insert-at-cursor', 7);
  for (const page of pages) {
    await page.evaluate(() => (window as any).fixtureReplaceInputs[7].select());
    expect(await field(page, 7).evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd])).toEqual([0, 12]);
  }
});
test('ReplaceInput height limits, vertical wheel, track click, slider drag and wrapped resizing', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) { await page.bringToFront(); await field(page, 8).hover(); await page.mouse.wheel(0, 80); }
  await equalScroll(pages, 8); await equalPixels(pages, info, 'wheel', 8, true);
  for (const page of pages) {
    const slider = page.locator('[data-index="8"] .vertical .slider'); const rect = await slider.boundingBox();
    await page.mouse.move(rect!.x + 5, rect!.y + 8); await page.mouse.down(); await page.mouse.move(rect!.x + 5, rect!.y + 33); await page.mouse.up();
  }
  await equalScroll(pages, 8); await equalPixels(pages, info, 'slider-drag', 8, true);
  for (const page of pages) await page.locator('[data-index="8"] .vertical').click({ position: { x: 5, y: 8 } });
  await equalScroll(pages, 8); await equalPixels(pages, info, 'track-click', 8, true);
  for (const page of pages) {
    await page.locator('[data-index="9"]').evaluate((el: HTMLElement) => el.style.width = '240px');
    await page.evaluate(() => { const replacement = (window as any).fixtureReplaceInputs[9]; if (replacement.inputBox) { replacement.width = 240; replacement.inputBox.layout(); } });
    await field(page, 9).hover();
  }
  await equalScroll(pages, 9); await equalPixels(pages, info, 'wrapped-narrow', 9, true);
});
test('ReplaceInput public messages, validation and clear keep native input events separate', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await field(page, 0).fill('temporary');
    await page.evaluate(() => { const replacement = (window as any).fixtureReplaceInputs[0]; replacement.showMessage({ content: 'Replacement preview available.', type: replacement.inputBox ? 1 : 'info' }); });
  }
  await equalPixels(pages, info, 'public-message');
  for (const page of pages) { await page.evaluate(() => (window as any).fixtureReplaceInputs[0].clearMessage()); await expect(page.locator('.monaco-inputbox-message')).toBeHidden(); await page.evaluate(() => (window as any).fixtureReplaceInputs[0].clear()); }
  await equalState(pages); await equalPixels(pages, info, 'clear', 0);
});
test('Find and Replace composition follows caller Tab order and preserves matched case', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) await page.getByRole('textbox', { name: 'Search to replace', exact: true }).focus();
  const expected = ['Replacement value', 'case', 'word', 'regex', 'preserve', 'Replace All'];
  for (const target of expected) for (const page of pages) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => { const active = document.activeElement as HTMLElement; return active.dataset.option ?? active.getAttribute('aria-label') ?? active.textContent; });
    expect(focused?.trim()).toBe(target);
  }
  for (const page of pages) {
    await page.keyboard.press('Enter'); await expect(page.locator('[data-output]')).toHaveText('Result RESULT result');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.locator('[data-composition] [data-option="preserve"]').click();
    await page.getByRole('button', { name: 'Replace All', exact: true }).click(); await expect(page.locator('[data-output]')).toHaveText('result result result');
  }
  const states = await Promise.all(pages.map(page => page.evaluate(() => (window as any).fixtureComposition.state)));
  expect(states[1]).toEqual(states[0]); await equalPixels(pages, info, 'composition-result');
});
