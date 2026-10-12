import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { menuPixels } from './menu-fixture';
async function pair(context: BrowserContext, theme = 'dark', query = '', kind = 'hover') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = []; for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=${kind}&theme=${theme}${query}`);
  await pages[1].goto(`/iframe.html?id=components-${kind}--specimen&viewMode=story&globals=theme:${theme}${query}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]); return pages;
}
async function show(pages: Page[], focus = true) { for (const page of pages) { await page.locator('.outside').focus(); await page.evaluate(focus => (window as any).showHover(focus), focus); await expect(page.getByRole('tooltip')).toBeVisible(); } }
async function equal(pages: Page[]) { const state = (page: Page) => page.evaluate(() => { const s = (window as any).fixtureState; return { actions: s.actions, visibility: s.visibility }; }); expect(await state(pages[1])).toEqual(await state(pages[0])); }
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) test(`Hover text, HTML, actions and focus / ${theme}`, async ({ context }, info) => {
  for (const query of ['', '&compact=true', '&html=true&actions=true']) {
    const pages = await pair(context, theme, query); await show(pages);
    await menuPixels(pages, info, `${theme}${query}`, '.workbench-hover-container');
    for (const page of pages) {
      await expect(page.getByRole('tooltip')).toBeFocused();
      if (query.includes('actions')) { await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Read details' })).toBeFocused(); await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); }
      else await page.keyboard.press('Escape');
      await expect(page.getByRole('tooltip')).toHaveCount(0); await expect(page.locator('.outside')).toBeFocused();
    }
    await equal(pages); for (const page of pages) await page.close();
  }
});
test('Hover four directions, viewport flipping and maximum-height scrolling', async ({ context }, info) => {
  for (const position of ['above','below','left','right']) {
    const pages = await pair(context, 'dark', `&position=${position}`); await show(pages);
    await menuPixels(pages, info, position, '.workbench-hover-container');
    for (const page of pages) { await page.evaluate(() => { const target = document.querySelector<HTMLElement>('.hover-target')!; target.style.left = '310px'; target.style.top = '400px'; (window as any).hideHover(); }); }
    await show(pages); await menuPixels(pages, info, `${position}-edge`, '.workbench-hover-container'); for (const page of pages) await page.close();
  }
  const pages = await pair(context, 'dark', '&long=true'); await show(pages);
  await menuPixels(pages, info, 'scroll-before', '.workbench-hover-container');
  for (const page of pages) { await page.getByRole('tooltip').hover(); await page.mouse.wheel(0, 130); }
  await menuPixels(pages, info, 'scroll-after', '.workbench-hover-container');
});
test('Tooltip real default delay, cancellation, re-entry and keyboard focus', async ({ context }, info) => {
  const pages = await pair(context, 'dark', '', 'tooltip');
  for (const page of pages) {
    await page.locator('.hover-target').hover(); await page.waitForTimeout(200); await expect(page.getByRole('tooltip')).toHaveCount(0);
    await page.mouse.move(400,450); await page.waitForTimeout(1600); await expect(page.getByRole('tooltip')).toHaveCount(0);
    await page.locator('.hover-target').hover(); await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 2500 });
  }
  await menuPixels(pages, info, 'managed-default', '.workbench-hover-container');
  for (const page of pages) { await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).toHaveCount(0); await page.mouse.move(400,450); await page.locator('.outside').focus(); await page.locator('.hover-target').focus(); await expect(page.getByRole('tooltip')).toBeVisible({ timeout:2500 }); await page.locator('.outside').focus(); await expect(page.getByRole('tooltip')).toHaveCount(0); }
  await equal(pages);
});
test('Tooltip content defaults, popup retention and Alt lock', async ({ context }) => {
  for (const html of [false, true]) {
    const pages = await pair(context, 'dark', `&delay=10&html=${html}`, 'tooltip');
    for (const page of pages) {
      await page.locator('.hover-target').hover(); await expect(page.getByRole('tooltip')).toBeVisible();
      await page.getByRole('tooltip').hover(); await page.waitForTimeout(300);
      if (html) { await expect(page.getByRole('tooltip')).toBeVisible(); await page.mouse.move(400,450); await expect(page.getByRole('tooltip')).toHaveCount(0); }
      else await expect(page.getByRole('tooltip')).toHaveCount(0);
      await page.locator('.hover-target').hover(); await expect(page.getByRole('tooltip')).toBeVisible(); await page.keyboard.down('Alt'); await page.getByRole('tooltip').hover(); await page.waitForTimeout(300); await expect(page.getByRole('tooltip')).toBeVisible(); await page.keyboard.up('Alt'); await expect(page.getByRole('tooltip')).toBeVisible(); await page.mouse.move(400,450); await expect(page.getByRole('tooltip')).toHaveCount(0);
    }
    await equal(pages);
  }
});
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) test(`Tooltip HTML and actions / ${theme}`, async ({ context }, info) => {
  const pages = await pair(context, theme, '&html=true&actions=true&delay=10', 'tooltip'); await show(pages);
  await menuPixels(pages, info, `${theme}-tooltip-html`, '.workbench-hover-container');
  for (const page of pages) { await page.keyboard.press('Shift+Tab'); await expect(page.locator('.action-container').last()).toBeFocused(); await page.keyboard.press('Tab'); await expect(page.getByRole('tooltip')).toBeFocused(); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press(' '); await expect(page.getByRole('tooltip')).toHaveCount(0); await expect(page.locator('.outside')).toBeFocused(); }
  await equal(pages);
});
test('Hover right alignment, forced placement, HTML resize and outside dismissal', async ({ context }, info) => {
  for (const query of ['&alignment=right', '&position=right&force=true&long=true', '&html=true']) {
    const pages = await pair(context, 'dark', query); await show(pages);
    await menuPixels(pages, info, `layout-${query}`, '.workbench-hover-container');
    if (query.includes('html')) {
      for (const page of pages) { await page.evaluate(() => { const p = document.createElement('p'); p.textContent = 'Dynamically expanded content'; document.querySelector('.html-hover-contents > div')!.append(p); }); }
      await menuPixels(pages, info, 'html-resize', '.workbench-hover-container');
    }
    for (const page of pages) { await page.mouse.click(405,450); await expect(page.getByRole('tooltip')).toHaveCount(0); }
    await equal(pages);
  }
});
test('Tooltip mouse placement follows preparation coordinates and modifier keys preserve hover', async ({ context }, info) => {
  const pages = await pair(context, 'dark', '&placement=mouse&delay=80', 'tooltip');
  for (const page of pages) { await page.locator('.hover-target').hover({ position: { x:20,y:12 } }); await page.mouse.move(170,140); await expect(page.getByRole('tooltip')).toBeVisible(); await page.keyboard.press('Shift'); await expect(page.getByRole('tooltip')).toBeVisible(); }
  await menuPixels(pages, info, 'mouse', '.workbench-hover-container');
  for (const page of pages) { await page.keyboard.press('a'); await expect(page.getByRole('tooltip')).toHaveCount(0); }
  await equal(pages);
});
test('Tooltip focused opening restores its trigger without scheduling another tooltip', async ({ context }) => {
  const pages = await pair(context, 'dark', '&delay=30', 'tooltip');
  for (const page of pages) { await page.locator('.hover-target').focus(); await page.evaluate(() => (window as any).showHover(true)); await expect(page.getByRole('tooltip')).toBeFocused(); await page.keyboard.press('Escape'); await expect(page.locator('.hover-target')).toBeFocused(); await page.waitForTimeout(150); await expect(page.getByRole('tooltip')).toHaveCount(0); }
  await equal(pages);
});
test('Nested hover retains its parent through interaction, restores focus and releases mouse tracking', async ({ context }, info) => {
  const pages = await pair(context, 'dark', '&html=true&nested=true'); await show(pages);
  for (const page of pages) {
    await page.locator('.nested-target').click(); await expect(page.getByRole('tooltip')).toHaveCount(2);
    await page.locator('.nested-inside').click(); await expect(page.getByRole('tooltip')).toHaveCount(2);
  }
  await menuPixels(pages, info, 'nested-child', '.workbench-hover-container');
  for (const page of pages) {
    await page.locator('.nested-target').hover(); await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(1); await expect(page.locator('.nested-target')).toBeFocused();
    await page.waitForTimeout(250); await expect(page.getByRole('tooltip')).toHaveCount(1);
    await page.mouse.move(410,470); await expect(page.getByRole('tooltip')).toHaveCount(0);
  }
});
test('Sticky hover stays locked through mouse exit and Alt release, then closes on Escape or outside click', async ({ context }, info) => {
  const pages = await pair(context, 'dark', '&sticky=true&html=true'); await show(pages);
  await menuPixels(pages, info, 'sticky-focus', '.workbench-hover-container');
  for (const page of pages) {
    await page.mouse.move(410,470); await page.waitForTimeout(250); await expect(page.getByRole('tooltip')).toHaveCount(1);
    await page.keyboard.press('Alt'); await page.keyboard.press('a'); await expect(page.locator('.workbench-hover-container')).toHaveClass(/locked/);
    await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).toHaveCount(0); await expect(page.locator('.outside')).toBeFocused();
    await page.evaluate(() => (window as any).showHover(true)); await expect(page.getByRole('tooltip')).toHaveCount(1);
    await page.locator('.outside').click(); await expect(page.getByRole('tooltip')).toHaveCount(0);
  }
});
