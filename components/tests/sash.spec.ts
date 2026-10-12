import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { menuPixels } from './menu-fixture';
async function pair(context:BrowserContext, theme = 'dark', options = '') {
  const pages = [await context.newPage(),await context.newPage()]; const errors:string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=sash&theme=${theme}${options}`);
  await pages[1].goto(`/iframe.html?id=components-sash--specimen&viewMode=story&globals=theme:${theme}${options}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]); return pages;
}
const sash = (page:Page,id = 'main') => page.locator(`[data-sash="${id}"]`);
async function state(page:Page) { return page.evaluate(() => (window as any).fixtureState); }
async function equalState(pages:Page[]) { await expect.poll(async () => JSON.stringify(await state(pages[1])) === JSON.stringify(await state(pages[0]))).toBe(true); }
async function center(page:Page,id = 'main') { const box = (await sash(page,id).boundingBox())!; return { x:box.x+box.width/2,y:box.y+box.height/2 }; }
async function cursors(pages:Page[],id = 'main') { expect(await sash(pages[1],id).evaluate(el => getComputedStyle(el).cursor)).toBe(await sash(pages[0],id).evaluate(el => getComputedStyle(el).cursor)); }
for (const theme of ['dark','light','hcDark','hcLight']) test(`Sash hover and active dragging / ${theme}`,async ({context},info) => {
  const pages = await pair(context,theme); await menuPixels(pages,info,'initial');
  for (const page of pages) { const point = await center(page); await page.mouse.move(point.x,point.y); await expect(sash(page)).not.toHaveClass(/hover/); await expect(sash(page)).toHaveClass(/hover/); }
  await cursors(pages); await menuPixels(pages,info,'hover');
  const points = await Promise.all(pages.map(page => center(page)));
  for (const page of pages) { await page.mouse.down(); await expect(page.locator('iframe')).toHaveClass(/pointer-events-disabled/); }
  await equalState(pages); await menuPixels(pages,info,'active');
  for (const [i,page] of pages.entries()) await page.mouse.move(points[i].x+36,points[i].y);
  await equalState(pages); await menuPixels(pages,info,'resized');
  for (const page of pages) { await page.mouse.up(); await page.mouse.move(410,470); await expect(page.locator('iframe')).not.toHaveClass(/pointer-events-disabled/); }
  await equalState(pages); await menuPixels(pages,info,'ended');
  expect((await state(pages[1])).events.map((event:any) => event.phase)).toEqual(['start','change','end']);
  expect((await state(pages[1])).bubbled).toBe(1);
});
test('Sash boundary states, fixed Alt modifier, mouse buttons and blur',async ({context}) => {
  const pages = await pair(context);
  const points = await Promise.all(pages.map(page => center(page)));
  for (const [i,page] of pages.entries()) { await page.mouse.move(points[i].x,points[i].y); await page.keyboard.down('Alt'); await page.mouse.down(); await page.keyboard.up('Alt'); await page.evaluate(() => window.dispatchEvent(new Event('blur'))); }
  for (const page of pages) await expect(sash(page)).toHaveClass(/active/);
  for (const [i,page] of pages.entries()) await page.mouse.move(points[i].x-300,points[i].y);
  await equalState(pages); await cursors(pages);
  for (const page of pages) await expect(sash(page)).toHaveClass(/minimum/);
  for (const [i,page] of pages.entries()) await page.mouse.move(points[i].x+300,points[i].y);
  await equalState(pages); await cursors(pages);
  for (const page of pages) { await expect(sash(page)).toHaveClass(/maximum/); await page.mouse.up(); }
  await equalState(pages);
  expect((await state(pages[1])).events.filter((entry:any) => entry.event).every((entry:any) => entry.event.altKey)).toBe(true);
  for (const page of pages) { const point = await center(page); await page.mouse.move(point.x,point.y); await page.mouse.down({button:'right'}); await page.mouse.move(point.x-12,point.y); await page.mouse.up({button:'right'}); }
  await equalState(pages); expect((await state(pages[1])).events.filter((entry:any) => entry.phase === 'start')).toHaveLength(2);
  const before = (await state(pages[1])).events.length;
  for (const page of pages) await sash(page).dispatchEvent('keydown',{key:'ArrowRight',bubbles:true});
  await equalState(pages); expect((await state(pages[1])).events.length).toBe(before);
});
test('Sash disabled state and cursor-only minimum/maximum hints',async ({context}) => {
  for (const value of ['disabled','minimum','maximum']) {
    const pages = await pair(context,'dark',`&state=${value}`);
    await cursors(pages);
    for (const page of pages) { const point = await center(page); await page.mouse.move(point.x,point.y); await page.mouse.down(); await page.mouse.move(point.x-12,point.y); await page.mouse.up(); }
    await equalState(pages);
    expect((await state(pages[1])).events.length).toBe(value === 'disabled' ? 0 : 3);
    if (value !== 'disabled') expect((await state(pages[1])).layout.main).toBe(148);
    for (const page of pages) await page.close();
  }
});
test('Sash linked halves, crossing event order, reset and boundary enablement',async ({context},info) => {
  const pages = await pair(context);
  for (const page of pages) { await sash(page,'grid-top').hover({position:{x:2,y:20}}); await expect(sash(page,'grid-bottom')).toHaveClass(/hover/); }
  await menuPixels(pages,info,'linked-hover');
  const starts = [];
  for (const page of pages) { const box = (await sash(page,'grid-bottom').locator('.start').boundingBox())!; starts.push({x:box.x+2,y:box.y+1}); await page.mouse.move(box.x+2,box.y+1); await page.mouse.down(); }
  await equalState(pages);
  expect((await state(pages[1])).events.map((event:any) => event.id)).toEqual(['grid-horizontal','grid-top','grid-bottom']);
  for (const [i,page] of pages.entries()) await page.mouse.move(starts[i].x+25,starts[i].y+18);
  await equalState(pages); await menuPixels(pages,info,'cross-active');
  for (const page of pages) await page.mouse.up();
  await equalState(pages);
  expect((await state(pages[1])).layout.gridX).toBe(215); expect((await state(pages[1])).layout.gridY).toBe(90);
  for (const page of pages) { const box = (await sash(page,'grid-bottom').locator('.start').boundingBox())!; await page.mouse.dblclick(box.x+2,box.y+1); }
  await equalState(pages);
  expect((await state(pages[1])).events.filter((event:any) => event.phase === 'reset').map((event:any) => event.id)).toEqual(['grid-horizontal','grid-top','grid-bottom']);
  for (const page of pages) await page.locator('.fixture-boundary').click();
  for (const page of pages) { await expect(sash(page,'grid-top').locator('.orthogonal-drag-handle')).toHaveCount(0); await expect(sash(page,'grid-bottom').locator('.orthogonal-drag-handle')).toHaveCount(0); }
  await menuPixels(pages,info,'disabled-orthogonal');
});
test('Sash orthogonal edge cursors and two-axis boundary drag',async ({context},info) => {
  const pages = await pair(context); const points = [];
  for (const page of pages) { const handle = sash(page,'boundary-bottom').locator('.start'); const box = (await handle.boundingBox())!; points.push({x:box.x+1,y:box.y+1}); await page.mouse.move(box.x+1,box.y+1); await expect(sash(page,'boundary-left')).toHaveClass(/hover/); }
  expect(await sash(pages[1],'boundary-bottom').locator('.start').evaluate(el => getComputedStyle(el).cursor)).toBe(await sash(pages[0],'boundary-bottom').locator('.start').evaluate(el => getComputedStyle(el).cursor));
  await menuPixels(pages,info,'boundary-hover');
  for (const [i,page] of pages.entries()) { await page.mouse.down(); await page.mouse.move(points[i].x+12,points[i].y+9); await page.mouse.up(); }
  await equalState(pages); await menuPixels(pages,info,'boundary-drag');
  expect((await state(pages[1])).layout.boundaryLeft).toBe(36); expect((await state(pages[1])).layout.boundaryBottom).toBe(73);
  for (const page of pages) { const box = (await sash(page,'boundary-bottom').locator('.end').boundingBox())!; await page.mouse.move(box.x+6,box.y+6); await page.mouse.down(); await page.mouse.move(box.x-5,box.y); await page.mouse.up(); }
  await equalState(pages); await menuPixels(pages,info,'boundary-end-drag');
  expect((await state(pages[1])).layout.boundaryRight).toBe(345); expect((await state(pages[1])).layout.boundaryBottom).toBe(67);
});
test('Sash native touch drag and double tap event order',async ({browser}) => {
  const context = await browser.newContext({viewport:{width:420,height:600},hasTouch:true});
  const pages = await pair(context);
  for (const page of pages) {
    const point = await center(page); const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y,id:1}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+40,y:point.y+10,id:1}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await equalState(pages); expect((await state(pages[1])).layout.main).toBe(200);
  for (const page of pages) { const point = await center(page); await page.touchscreen.tap(point.x,point.y); await page.touchscreen.tap(point.x,point.y); }
  await equalState(pages);
  expect((await state(pages[1])).events.slice(-3).map((event:any) => event.phase)).toEqual(['start','reset','end']);
  expect((await state(pages[1])).layout.main).toBe(160);
  for (const page of pages) {
    const box = (await sash(page,'grid-bottom').locator('.start').boundingBox())!; const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+2,y:box.y+1,id:2}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+42,y:box.y+21,id:2}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await equalState(pages); expect((await state(pages[1])).layout.gridX).toBe(230); expect((await state(pages[1])).layout.gridY).toBe(92);
  await context.close();
});
test('Sash Vue lifecycle disposes active and empty disabled sessions',async ({context}) => {
  const pages = await pair(context,'dark','&state=disabled'); const page = pages[1];
  await page.evaluate(() => {
    const active = new Set<EventListenerOrEventListenerObject>(); const add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window);
    window.addEventListener = ((type:string, listener:EventListenerOrEventListenerObject, options?:any) => { if (type === 'mousemove' || type === 'mouseup') active.add(listener); add(type,listener,options); }) as typeof window.addEventListener;
    window.removeEventListener = ((type:string, listener:EventListenerOrEventListenerObject, options?:any) => { active.delete(listener); remove(type,listener,options); }) as typeof window.removeEventListener;
    (window as any).sashSessionListeners = active;
  });
  await sash(page).dispatchEvent('mousedown',{button:0,clientX:180,clientY:60,bubbles:true,cancelable:true});
  expect(await page.evaluate(() => (window as any).sashSessionListeners.size)).toBe(0);
  await page.locator('.fixture-state').click(); const point = await center(page); await page.mouse.move(point.x,point.y); await page.mouse.down();
  expect(await page.evaluate(() => (window as any).sashSessionListeners.size)).toBe(2);
  await page.locator('.fixture-unmount').evaluate(el => (el as HTMLElement).click());
  await expect(sash(page)).toHaveCount(0); await expect(page.locator('iframe')).not.toHaveClass(/pointer-events-disabled/);
  expect(await page.evaluate(() => (window as any).sashSessionListeners.size)).toBe(0);
  const before = (await state(page)).events.length; await page.mouse.move(point.x+40,point.y); await page.mouse.up();
  expect((await state(page)).events.length).toBe(before);
  expect(await page.locator('.monaco-sash > style').count()).toBe(0);
});
