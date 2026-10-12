import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { settleFixturePaint } from './paint';

async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  for (const page of pages) page.on('pageerror', error => expect(error.message).toBe(''));
  await pages[0].goto(`/reference/index.html?kind=sidebar-title&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-sidebar-title--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  return pages;
}
async function pixels(pages: Page[], info: TestInfo, label: string) {
  const buffers = [];
  for (const page of pages) {
    await settleFixturePaint(page);
    buffers.push(await page.screenshot({ caret: 'hide', animations: 'disabled' }));
  }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect([b.width, b.height]).toEqual([a.width, a.height]);
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) {
    for (const [suffix, body] of [['original', buffers[0]], ['vue', buffers[1]], ['diff', PNG.sync.write(diff)]] as const) {
      await info.attach(`${label}-${suffix}`, { body, contentType: 'image/png' });
    }
  }
  expect(count, label).toBe(0);
}
async function state(pages: Page[]) {
  const values = await Promise.all(pages.map(page => page.evaluate(() => ({
    events: { actions: (window as any).fixtureState.actions, visibility: (window as any).fixtureState.visibility },
    focused: document.activeElement?.getAttribute('aria-label'),
    titles: [...document.querySelectorAll('.title-label h2')].map(el => el.textContent),
    hasActions: [...document.querySelectorAll('.composite.title')].map(el => el.classList.contains('has-actions')),
  }))));
  expect(values[1]).toEqual(values[0]);
  return values[0];
}
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`SidebarTitle title, actions, clipping and focus / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, 'initial');
    for (const page of pages) {
      await page.locator('[data-case="actions"] [aria-label="Refresh Explorer"]').hover();
    }
    await pixels(pages, info, 'hover');
    for (const page of pages) {
      await page.mouse.move(410, 470);
      await page.evaluate(() => (window as any).fixtureFocusSidebarTitle(1));
    }
    await state(pages);
    await pixels(pages, info, 'focused');
    for (const page of pages) {
      await page.getByRole('button', { name: 'Move focus outside' }).focus();
      await page.setViewportSize({ width: 270, height: 480 });
    }
    await pixels(pages, info, 'narrow');
  });
}
test('SidebarTitle keyboard activation, secondary menu and live update', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.evaluate(() => (window as any).fixtureFocusSidebarTitle(1));
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
  }
  expect((await state(pages)).events.actions).toEqual(['actions:new-folder']);
  for (const page of pages) {
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(page.locator('.monaco-menu')).toBeVisible();
  }
  await pixels(pages, info, 'secondary');
  for (const page of pages) {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }
  await state(pages);
  for (const page of pages) await page.evaluate(() => (window as any).fixtureUpdateSidebarTitle('New section', true));
  await state(pages);
  await pixels(pages, info, 'updated');
  for (const page of pages) await page.evaluate(() => (window as any).fixtureUpdateSidebarTitle('', false));
  await state(pages);
  await pixels(pages, info, 'empty');
});
test('SidebarTitle uses managed title hover and restores keyboard focus', async ({ context }, info) => {
  const pages = await pair(context);
  await context.clock.install();
  for (const page of pages) await page.locator('[data-case="actions"] h2').hover();
  await context.clock.fastForward(1500);
  for (const page of pages) await expect(page.locator('.monaco-hover')).toContainText('Explorer (⇧⌘E)');
  await pixels(pages, info, 'title-hover');
  for (const page of pages) {
    await page.mouse.move(410, 470);
  }
  await context.clock.fastForward(201);
  for (const page of pages) await expect(page.locator('.monaco-hover')).toHaveCount(0);
});
