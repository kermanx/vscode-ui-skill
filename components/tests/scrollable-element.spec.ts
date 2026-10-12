import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { menuPixels } from './menu-fixture';
async function pair(context: BrowserContext, theme = 'dark', options = '') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = []; for (const page of pages) page.on('pageerror', e => errors.push(e.message));
  await pages[0].goto(`/reference/index.html?kind=scrollable-element&theme=${theme}${options}`);
  await pages[1].goto(`/iframe.html?id=components-scrollable-element--specimen&viewMode=story&globals=theme:${theme}${options}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady && Object.keys((window as any).fixtureState).length === 4); await page.evaluate(() => document.fonts.ready); }
  for (const page of pages) { await expect(page.locator('[data-index="2"] > .scrollbar.vertical')).toHaveClass(/invisible/); await expect(page.locator('[data-index="3"] > .scrollbar.vertical')).toHaveClass(/invisible/); }
  expect(errors).toEqual([]); return pages;
}
async function state(page: Page) { return page.evaluate(() => { const s = (window as any).fixtureState; return { main: s.main, horizontal: s.horizontal, outer: s.outer, inner: s.inner }; }); }
async function equalState(pages: Page[]) { await expect.poll(async () => JSON.stringify(await state(pages[1])) === JSON.stringify(await state(pages[0]))).toBe(true); }
async function wheel(pages: Page[], dx: number, dy: number, extra: Record<string, unknown> = {}, index = 0) {
  for (const page of pages) await page.locator(`[data-index="${index}"]`).evaluate((el, init) => {
    const event = new WheelEvent('wheel', init);
    // Chromium's synthetic legacy wheelDelta has the opposite sign to trusted wheel events.
    // Exercise the modern deltaX/deltaY normalization path explicitly.
    for (const key of ['wheelDelta', 'wheelDeltaX', 'wheelDeltaY']) Object.defineProperty(event, key, { value: undefined });
    el.dispatchEvent(event);
  }, { deltaX: dx, deltaY: dy, deltaMode: 0, bubbles: true, cancelable: true, ...extra });
  await equalState(pages);
}
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) test(`ScrollableElement two-axis controls and shadows / ${theme}`, async ({ context }, info) => {
  const pages = await pair(context, theme); await equalState(pages);
  for (const page of pages) await page.locator('[data-index="0"]').hover({ position: { x: 80, y: 40 } });
  await menuPixels(pages, info, 'initial');
  await wheel(pages, 0, 160); await wheel(pages, 120, 0);
  await menuPixels(pages, info, 'two-shadows');
  for (const page of pages) {
    const track = page.locator('[data-index="0"] > .scrollbar.vertical'); const box = await track.boundingBox();
    await page.mouse.move(box!.x + 5, box!.y + 154); await page.mouse.down();
  }
  await equalState(pages); await menuPixels(pages, info, 'track-active');
  for (const page of pages) { await page.mouse.move(395, 85); await page.mouse.up(); }
  await equalState(pages); await menuPixels(pages, info, 'vertical-drag');
  for (const page of pages) {
    const thumb = page.locator('[data-index="0"] > .scrollbar.horizontal > .slider'); const box = await thumb.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + 5); await page.mouse.down(); await page.mouse.move(box!.x + box!.width / 2 - 40, box!.y + 5); await page.mouse.up();
  }
  await equalState(pages); await menuPixels(pages, info, 'horizontal-drag');
});
test('ScrollableElement wheel normalization, modifiers and boundaries', async ({ context }) => {
  const pages = await pair(context);
  await wheel(pages, 0, 0.1); expect((await state(pages[1])).main.scrollTop).toBe(1);
  await wheel(pages, 2, 1); await wheel(pages, 3, 3); await wheel(pages, 0, 2, { deltaMode: 1 });
  await wheel(pages, 0, 10, { altKey: true }); await wheel(pages, 0, 20, { shiftKey: true });
  await wheel(pages, 0, 12, { ctrlKey: true }); await wheel(pages, 0, -9000); await wheel(pages, -9000, 0);
  expect((await state(pages[1])).main.scrollTop).toBe(0); expect((await state(pages[1])).main.scrollLeft).toBe(0);
  for (const page of pages) {
    const result = await page.locator('[data-index="0"]').evaluate(el => { const event = new WheelEvent('wheel', { deltaY:-10, bubbles:true, cancelable:true }); for (const key of ['wheelDelta', 'wheelDeltaX', 'wheelDeltaY']) Object.defineProperty(event, key, { value: undefined }); el.dispatchEvent(event); return event.defaultPrevented; });
    expect(result).toBe(false);
  }
  for (const page of pages) { await page.locator('[data-index="0"]').hover({ position: { x:80, y:40 } }); await page.mouse.wheel(0, 60); }
  await equalState(pages); expect((await state(pages[1])).main.scrollTop).toBeGreaterThan(0);
});
test('ScrollableElement automatic resize measurement and dynamic modes', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) await page.locator('.fixture-position').click();
  await equalState(pages); expect((await state(pages[1])).main.scrollTop).toBe(231);
  for (const page of pages) await page.locator('.fixture-resize').click();
  await equalState(pages); await menuPixels(pages, info, 'resize');
  for (const page of pages) await page.locator('.fixture-modes').click();
  await equalState(pages); await menuPixels(pages, info, 'modes');
  await wheel(pages, 12, 0); await menuPixels(pages, info, 'hidden-axis-scrolls');
  for (const page of pages) await page.locator('.fixture-shrink').click();
  await equalState(pages); await menuPixels(pages, info, 'shrink');
  expect((await state(pages[1])).main.scrollTop).toBe(0);
  for (const page of pages) {
    const count = await page.locator('[data-index="0"] > .vc-scrollable-viewport > .vc-scrollable-content').evaluate(el => new Promise<number>(resolve => { let mutations = 0; const observer = new MutationObserver(records => { mutations += records.length; }); observer.observe(el, { subtree:true, attributes:true, childList:true }); setTimeout(() => { observer.disconnect(); resolve(mutations); }, 150); }));
    expect(count, 'content observation settles without a render loop').toBe(0);
  }
});
test('ScrollableElement axis modes, no shadows, and page tracks', async ({ context }, info) => {
  const pages = await pair(context, 'dark', '&horizontal=hidden&vertical=visible&paged=true&shadows=false');
  for (const page of pages) {
    const box = await page.locator('[data-index="0"] > .scrollbar.vertical').boundingBox();
    await page.mouse.click(box!.x + 5, box!.y + 160);
  }
  await equalState(pages); expect((await state(pages[1])).main.scrollTop).toBe(176);
  await menuPixels(pages, info, 'paged');
  await wheel(pages, 80, 0); await menuPixels(pages, info, 'hidden-horizontal');
});
for (const contain of [false, true]) test(`ScrollableElement nested wheel propagation / contain=${contain}`, async ({ context }, info) => {
  const pages = await pair(context, 'dark', `&contain=${contain}`);
  await wheel(pages, 0, 900, {}, 3);
  expect((await state(pages[1])).inner.scrollTop).toBe(154);
  expect((await state(pages[1])).outer.scrollTop).toBe(0);
  await wheel(pages, 0, 40, {}, 3);
  expect((await state(pages[1])).outer.scrollTop).toBe(contain ? 0 : 50);
  await menuPixels(pages, info, 'nested-boundary');
});
test('ScrollableElement huge content, minimum sliders and viewport resizing', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) await page.locator('.fixture-huge').click();
  for (const page of pages) await expect.poll(async () => (await state(page)).main.scrollHeight).toBe(100000);
  await equalState(pages);
  for (const page of pages) {
    const lengths = await page.locator('[data-index="0"] > .scrollbar > .slider').evaluateAll(elements => elements.map(el => { const box = el.getBoundingClientRect(); return el.parentElement!.classList.contains('horizontal') ? box.width : box.height; }));
    expect(lengths).toEqual([20, 20]);
  }
  await wheel(pages, 0, 40000); await wheel(pages, 40000, 0);
  expect((await state(pages[1])).main.scrollTop).toBe(50000);
  expect((await state(pages[1])).main.scrollLeft).toBe(50000);
  for (const page of pages) await page.setViewportSize({ width:220, height:480 });
  for (const page of pages) await expect.poll(async () => (await state(page)).main.width).toBe(180);
  await equalState(pages);
  for (const page of pages) await page.locator('[data-index="0"]').hover({ position: { x:30, y:30 } });
  await menuPixels(pages, info, 'minimum-sliders');
});
