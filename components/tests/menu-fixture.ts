import { expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
export async function menuPair(context: BrowserContext, kind: 'menu' | 'dropdown-panel', theme = 'dark', options = '') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=${kind}&theme=${theme}${options}`);
  await pages[1].goto(`/iframe.html?id=components-${kind === 'menu' ? 'menu' : 'dropdown'}--specimen&viewMode=story&globals=theme:${theme}${options}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
export async function menuPixels(pages: Page[], info: TestInfo, name: string, selector = '[data-testid="specimen"]') {
  const images: Buffer[] = [], geometry = [];
  for (const page of pages) {
    await page.bringToFront();
    const target = page.locator(selector).last();
    geometry.push(await target.evaluate(el => el.getBoundingClientRect().toJSON()));
    images.push(await target.screenshot({ animations: 'disabled' }));
  }
  expect(geometry[1], `${name} geometry`).toEqual(geometry[0]);
  const [a, b] = images.map(buffer => PNG.sync.read(buffer));
  expect([b.width, b.height]).toEqual([a.width, a.height]);
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) for (const [index, body] of [...images, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, `${name} pixels`).toBe(0);
}
export function menuState(page: Page) { return page.evaluate(() => { const s = (window as any).fixtureState; return { actions: s.actions, cancels: s.cancels }; }); }
