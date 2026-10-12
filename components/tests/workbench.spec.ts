import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { menuPixels } from './menu-fixture';
import { settleFixturePaint } from './paint';

async function pixels(pages: Page[], info: any, name: string, repaint = false) {
  for (const page of pages) {
    await expect.poll(() => page.locator('.part.editor .scrollbar.horizontal').evaluate(element => Math.round(element.getBoundingClientRect().width) === element.parentElement!.clientWidth)).toBe(true);
    if (repaint) {
      await expect.poll(() => page.locator('.scrollbar, .vc-list-scrollbar, .vc-tree-scrollbar').evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '0'))).toBe(true);
      await settleFixturePaint(page, 'filter');
    }
  }
  await menuPixels(pages, info, name);
}
test.setTimeout(120000);
test.use({ viewport: { width: 1100, height: 620 } });
async function pair(context: BrowserContext, theme = 'dark', side = 'left') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0]!.goto(`/reference/index.html?kind=workbench&theme=${theme}&side=${side}`);
  await pages[1]!.goto(`/iframe.html?id=compositions-workbench--specimen&viewMode=story&globals=theme:${theme}&side=${side}`);
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  expect(errors).toEqual([]);
  await equal(pages);
  return pages;
}
async function state(page: Page) { return page.evaluate(() => (window as any).fixtureApi.snapshot()); }
async function equal(pages: Page[]) {
  await expect(async () => expect(await state(pages[1]!)).toEqual(await state(pages[0]!))).toPass({ timeout: 2000 });
}
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Workbench composed native controls / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, 'composed');
  });
}
test('Workbench region resize and controlled visibility', async ({ context }, info) => {
  const pages = await pair(context, 'dark', 'right');
  const layouts = [{ sidebarWidth: 310, panelHeight: 210 }, { sidebarVisible: false }, { sidebarVisible: true, panelVisible: false }, { panelVisible: true, statusBarVisible: false }, { statusBarVisible: true }];
  for (const [index, value] of layouts.entries()) {
    for (const page of pages) await page.evaluate(value => (window as any).fixtureApi.set(value), value);
    await equal(pages);
    await pixels(pages, info, `layout-${index}`, true);
  }
});
test('Workbench file opening, panel commands and activity visibility', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.clock.setFixedTime(new Date('2026-01-01T00:00:00Z'));
    await page.locator('.explorer-folders-view .monaco-list-row').filter({ hasText: 'package.json' }).click();
    await page.mouse.move(1090, 600);
  }
  await equal(pages);
  expect((await state(pages[0]!)).editor).toBe('package');
  await pixels(pages, info, 'file-open', true);
  for (const page of pages) {
    await page.locator('.panel .action-label[aria-label="Hide Panel"]').click();
    await page.mouse.move(1090, 600);
  }
  await equal(pages);
  expect((await state(pages[0]!)).layout.panelVisible).toBe(false);
  await pixels(pages, info, 'panel-close', true);
  for (const page of pages) {
    await page.locator('.statusbar-item').filter({ has: page.locator('[aria-label="2 errors and 1 warning"]') }).click();
    await page.mouse.move(1090, 600);
  }
  await equal(pages);
  expect((await state(pages[0]!)).layout.panelVisible).toBe(true);
  await pixels(pages, info, 'panel-open', true);
  for (const page of pages) {
    await page.locator('.activitybar .action-label').first().click();
    await page.mouse.move(1090, 600);
  }
  await equal(pages);
  expect((await state(pages[0]!)).layout.sidebarVisible).toBe(false);
  await pixels(pages, info, 'sidebar-close', true);
  for (const page of pages) {
    await page.clock.setFixedTime(new Date('2026-01-01T00:00:00.400Z'));
    await page.locator('.activitybar .action-label').first().click();
    await page.mouse.move(1090, 600);
  }
  await equal(pages);
  expect((await state(pages[0]!)).layout.sidebarVisible).toBe(true);
  await pixels(pages, info, 'sidebar-open', true);
});
