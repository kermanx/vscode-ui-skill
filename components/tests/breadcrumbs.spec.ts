import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { settleFixturePaint } from './paint';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=breadcrumbs&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-breadcrumbs--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
async function equalPixels(pages: Page[], info: TestInfo, name: string, index?: number, keepPointer = false) {
  const buffers: Buffer[] = [];
  for (const page of pages) {
    await page.bringToFront(); await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    if (!keepPointer) await page.mouse.move(415, 475);
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
const row = (page: Page, index: number) => page.locator(`[data-index="${index}"]`);
async function equalState(pages: Page[]) {
  for(const page of pages) await page.evaluate(async()=>{await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
  const states = await Promise.all(pages.map(page => page.evaluate(() => {
    const widgets=(window as any).fixtureBreadcrumbs;
    return {events:(window as any).fixtureState.events,focus:(window as any).fixtureState.focus,
      widgets:widgets.map((widget:any)=>({focus:widget.getFocused()?.id,selection:widget.getSelection()?.id})),
      active:document.activeElement?.getAttribute('role'),
      classes:[...document.querySelectorAll('.monaco-breadcrumb-item')].map(node=>[node.classList.contains('focused'),node.classList.contains('selected')])};
  })));
  expect(states[1]).toEqual(states[0]);
}
for (const theme of ['dark','light','hcDark','hcLight']) {
  test(`Breadcrumbs file/symbol labels, focus and selection / ${theme}`, async ({context},info)=>{
    const pages=await pair(context,theme);
    await equalPixels(pages,info,'default');
    for(const page of pages)await row(page,0).getByRole('listitem').nth(1).hover();
    await equalPixels(pages,info,'hover',0,true);
    for(const page of pages)await row(page,0).getByRole('listitem').nth(1).click();
    await equalState(pages);await equalPixels(pages,info,'focus-selection',0);
    for(const page of pages)await page.keyboard.press('ArrowRight');
    await equalState(pages);await equalPixels(pages,info,'focus-next',0);
    for(const page of pages)await page.locator('.outside').focus();
    await equalState(pages);await equalPixels(pages,info,'blur',0);
    for(const page of pages) { await page.evaluate(()=>(window as any).fixtureBreadcrumbs[1].setFocused('method')); await page.keyboard.press('Space'); }
    await equalState(pages);await equalPixels(pages,info,'symbol-selected',1);
    for(const page of pages) await page.evaluate(async()=>{(window as any).fixtureBreadcrumbs[4].revealLast();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
    await equalPixels(pages,info,'deprecated-overflow',4);
  });
}
test('Breadcrumbs workbench keyboard commands, disabled clicks and empty root',async({context})=>{
  const pages=await pair(context);
  for(const page of pages)await page.evaluate(()=>(window as any).fixtureBreadcrumbs[1].focus());
  for(const key of ['ArrowRight','ArrowLeft','ArrowLeft','Enter','ArrowDown','Space','Home','End','Escape']){
    for(const page of pages)await page.keyboard.press(key);await equalState(pages);
  }
  for(const page of pages)await row(page,3).getByRole('listitem').nth(1).click();
  await equalState(pages);
  for(const page of pages)await page.evaluate(()=>(window as any).fixtureBreadcrumbs[3].focus());
  for(const key of ['ArrowLeft','Space']){for(const page of pages)await page.keyboard.press(key);await equalState(pages);}
  for(const page of pages){await page.evaluate(()=>(window as any).fixtureBreadcrumbs[7].focus());await expect(row(page,7).getByRole('list')).toBeFocused();}
  await equalState(pages);
});
test('Breadcrumbs overflow wheel, track, drag, reveal and resize',async({context},info)=>{
  const pages=await pair(context);
  const positions=async()=>{const data=await Promise.all(pages.map(page=>row(page,5).getByRole('list').evaluate(el=>[el.scrollLeft,el.scrollWidth,el.clientWidth])));expect(data[1]).toEqual(data[0]);};
  for(const page of pages){await row(page,5).hover();await page.mouse.wheel(0,80);await page.waitForTimeout(50);}
  await positions();await equalPixels(pages,info,'wheel',5,true);
  for(const page of pages){const track=row(page,5).locator('.scrollbar.horizontal');await track.click({position:{x:230,y:1}});}
  await positions();await equalPixels(pages,info,'track',5);
  for(const page of pages){const slider=row(page,5).locator('.horizontal .slider');const box=(await slider.boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+1);await page.mouse.down();await page.mouse.move(box.x+box.width/2-40,box.y+1);await page.mouse.up();}
  await positions();await equalPixels(pages,info,'drag',5);
  for(const page of pages)await page.evaluate(async()=>{(window as any).fixtureBreadcrumbs[5].revealLast();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
  await positions();await equalPixels(pages,info,'reveal-last',5);
  for(const page of pages)await page.evaluate(()=>(window as any).fixtureBreadcrumbs[5].setFocused('folder0'));
  await positions();await equalState(pages);
  for(const page of pages){await row(page,5).evaluate((el:HTMLElement)=>el.style.width='220px');await page.evaluate(()=>(window as any).fixtureBreadcrumbs[5].layout());await page.waitForTimeout(100);}
  await positions();await equalPixels(pages,info,'resize',5);
});
test('Breadcrumbs changed paths preserve selection index and clear focus',async({context},info)=>{
  const pages=await pair(context);
  for(const page of pages)await row(page,0).getByRole('listitem').nth(1).click();
  for(const items of [
    [{id:'src',label:'src',kind:'folder'},{id:'editor',label:'new-folder',kind:'folder'},{id:'newfile',label:'new.ts',kind:'file',icon:'file-code'}],
    [{id:'src',label:'src',kind:'folder'}],[],
    [{id:'restored',label:'restored.ts',kind:'file',icon:'file-code'}],
  ]){
    for(const page of pages){await page.evaluate(items=>(window as any).fixtureSetItems(0,items),items);await page.waitForTimeout(50);}
    await equalState(pages);await equalPixels(pages,info,'updated-path',0);
  }
});
