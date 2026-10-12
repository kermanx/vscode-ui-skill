import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { settleFixturePaint } from './paint';
test.setTimeout(60000);
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=find-input&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-find-input--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
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
const option = (page: Page, index: number, name: string) => page.locator(`[data-index="${index}"] [data-option="${name}"]`);
async function equalState(pages: Page[]) {
  const states = await Promise.all(pages.map(page => page.evaluate(() => {
    const { values, cases, words, regexes, activeOptions, changes, options, inputEvents } = (window as any).fixtureState;
    const active = document.activeElement as HTMLElement;
    return { values, cases, words, regexes, activeOptions, changes, options, inputEvents,
      focused: active?.getAttribute('data-option') ?? active?.getAttribute('aria-label'), inputType: active?.tagName };
  })));
  expect(states[1]).toEqual(states[0]);
}
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`FindInput compositions, toggles and validation / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await equalPixels(pages, info, 'default');
    for (const page of pages) await field(page, 0).focus();
    await equalPixels(pages, info, 'input-focus', 0);
    for (const page of pages) await option(page, 0, 'case').hover();
    await equalPixels(pages, info, 'option-hover', 0, true);
    for (const page of pages) await option(page, 0, 'case').click();
    await equalState(pages); await equalPixels(pages, info, 'option-click-refocus', 0);
    for (const page of pages) { await option(page, 1, 'regex').focus(); await page.keyboard.press('Space'); }
    await equalState(pages); await equalPixels(pages, info, 'keyboard-checked', 1);
    for (const page of pages) await field(page, 6).focus();
    const messages = await Promise.all(pages.map(page => page.locator('.monaco-inputbox-message').evaluate(el => ({ text: el.textContent, rect: JSON.stringify(el.getBoundingClientRect()) }))));
    expect(messages[1]).toEqual(messages[0]);
    await equalPixels(pages, info, 'validation');
  });
}
test('FindInput option navigation, click focus, validation and disabled state', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) await option(page, 5, 'case').focus();
  for (const key of ['ArrowLeft', 'Space', 'ArrowRight', 'ArrowRight', 'Enter', 'ArrowRight', 'Space', 'ArrowRight', 'Escape']) {
    for (const page of pages) await page.keyboard.press(key);
    await equalState(pages);
  }
  for (const page of pages) { await option(page, 5, 'selection').click(); await expect(option(page, 5, 'selection')).toBeFocused(); await option(page, 6, 'regex').click(); await expect(field(page, 6)).not.toHaveAttribute('aria-invalid'); }
  await equalState(pages);
  for (const page of pages) { await option(page, 6, 'regex').click(); await expect(field(page, 6)).toHaveAttribute('aria-invalid', 'true'); await field(page, 6).fill('[valid]'); await expect(field(page, 6)).not.toHaveAttribute('aria-invalid'); }
  await equalState(pages); await equalPixels(pages, info, 'valid-regex', 6);
  for (const page of pages) {
    await expect(field(page, 2)).toBeDisabled();
    await expect(option(page, 2, 'regex')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('[data-index="3"] .controls')).toBeHidden();
    await expect(page.locator('[data-index="4"] .monaco-custom-toggle')).toHaveCount(1);
  }
});
test('FindInput history and composition events', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) await field(page, 7).focus();
  for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown']) {
    for (const page of pages) await page.keyboard.press(key);
    await equalState(pages);
  }
  for (const page of pages) {
    await field(page, 7).fill('new query');
    await page.evaluate(() => { const input = (window as any).fixtureFindInputs[7]; (input.submit ?? input.onSearchSubmit).call(input); });
    await field(page, 7).fill(''); await page.keyboard.press('ArrowUp');
    await field(page, 0).focus();
    await field(page, 0).dispatchEvent('compositionstart', { data: '' });
    expect(await page.evaluate(() => (window as any).fixtureFindInputs[0].isImeSessionInProgress)).toBe(true);
    await field(page, 0).fill('输入');
    await field(page, 0).dispatchEvent('compositionend', { data: '输入' });
    expect(await page.evaluate(() => (window as any).fixtureFindInputs[0].isImeSessionInProgress)).toBe(false);
  }
  await equalState(pages);
});
test('FindInput multiline measurement, trailing newline, wrapping and selection', async ({ context }, info) => {
  const pages = await pair(context);
  for (const text of ['One line', 'First\nSecond\n', '', 'One\nTwo\nThree']) {
    for (const page of pages) await field(page, 8).fill(text);
    await equalState(pages); await equalPixels(pages, info, 'multiline', 8);
  }
  for (const page of pages) {
    await page.locator('[data-index="9"]').evaluate((el: HTMLElement) => el.style.width = '240px');
    // Host layout changes call the original widget's public layout method.
    await page.evaluate(() => { const input = (window as any).fixtureFindInputs[9]; input.layout?.({ collapsedFindWidget: false, narrowFindWidget: false, reducedFindWidget: false }); });
  }
  await equalPixels(pages, info, 'wrapped-narrow', 9);
  for (const page of pages) {
    await field(page, 8).focus(); await page.evaluate(() => (window as any).fixtureFindInputs[8].select());
    const range = await field(page, 8).evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd, el.value.length]);
    expect(range[0]).toBe(0); expect(range[1]).toBe(range[2]);
  }
});
