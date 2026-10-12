import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { settleFixturePaint } from './paint';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=pane&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-pane--specimen&viewMode=story&globals=theme:${theme}`);
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
    buffers.push(await (index === undefined ? page.getByTestId('specimen') : page.locator(`.specimen > [data-index="${index}"]`)).screenshot({ animations: 'disabled', caret: 'hide' }));
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
test.use({viewport:{width:420,height:900}});
const row=(page:Page,index:number)=>page.locator(`.specimen > [data-index="${index}"]`);
const header=(page:Page,index:number)=>row(page,index).locator('.pane-header');
async function sameState(pages:Page[]) {
  for(const page of pages)await page.evaluate(async()=>{await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
  const states=await Promise.all(pages.map(page=>page.evaluate(()=>({
    expanded:(window as any).fixturePanes.map((pane:any)=>pane.isExpanded()),
    expansion:(window as any).fixtureState.expansion,actions:(window as any).fixtureState.actions,visibility:(window as any).fixtureState.visibility,renders:(window as any).fixtureState.renders,
    headers:[...document.querySelectorAll('.pane-header')].map(node=>({expanded:node.getAttribute('aria-expanded'),role:node.getAttribute('role'),tab:node.getAttribute('tabindex'),label:node.getAttribute('aria-label'),focused:node.classList.contains('focused'),title:node.querySelector('h3.title')?.textContent,descriptions:[...node.querySelectorAll('.description')].map(el=>el.textContent)}))
  }))));
  expect(states[1]).toEqual(states[0]);
}
for(const theme of ['dark','light','hcDark','hcLight']) {
  test(`Pane headers, sidebars and control combinations / ${theme}`,async({context},info)=>{
    const pages=await pair(context,theme);
    await sameState(pages);await equalPixels(pages,info,'default');
    for(const page of pages)await header(page,0).hover();
    await equalPixels(pages,info,'header-hover',0,true);
    for(const page of pages)await header(page,0).focus();
    await sameState(pages);await equalPixels(pages,info,'header-focus',0);
    for(const page of pages)await page.keyboard.press('Enter');
    await sameState(pages);for(const page of pages) await expect(row(page,0).locator('.pane-body')).toHaveCount(0);await equalPixels(pages,info,'collapsed',0);
    for(const page of pages)await page.keyboard.press('ArrowRight');
    await sameState(pages);await equalPixels(pages,info,'expanded',0);
    for(const page of pages)await header(page,2).focus();
    await equalPixels(pages,info,'count-actions-focus',2);
  });
}
test('Pane header keyboard, modified keys, noncollapsible and external updates',async({context},info)=>{
  const pages=await pair(context);
  for(const page of pages)await header(page,1).focus();
  for(const key of ['Space','ArrowRight','ArrowLeft','Control+Enter','Shift+ArrowLeft','Alt+ArrowRight','Home','End']){
    for(const page of pages)await page.keyboard.press(key);await sameState(pages);
  }
  for(const page of pages){await header(page,4).click();expect(await page.evaluate(()=>(window as any).fixturePanes[4].setExpanded(false))).toBe(false);}
  await sameState(pages);
  for(const props of [{headerVisible:false},{headerVisible:true,collapsible:false},{collapsible:true,title:'Updated title',description:'new description'},{description:''}]){
    for(const page of pages)await page.evaluate(props=>(window as any).fixtureUpdatePane(3,props),props);
    await sameState(pages);await equalPixels(pages,info,'updated-header',3);
  }
});
test('Pane lazy rendering, delayed detach and retained child state',async({context})=>{
  const pages=await pair(context);
  for(const page of pages){
    expect(await page.evaluate(()=>(window as any).fixtureState.renders[1])).toBe(0);
    await expect(row(page,1).locator('.pane-body')).toHaveCount(0);
    await header(page,1).click();
    await expect(row(page,1).getByRole('textbox')).toBeVisible();
    await row(page,1).getByRole('textbox').fill('Keep this state');
    await row(page,1).getByRole('button',{name:'Count 0',exact:true}).click();
    await page.evaluate(()=>{(window as any).savedPaneBody=document.querySelector('[data-index="1"] .pane-body');});
    await header(page,1).click();
    expect(await row(page,1).locator('.pane-body').count()).toBe(1);
    await page.waitForTimeout(240);
    await expect(row(page,1).locator('.pane-body')).toHaveCount(0);
    expect(await page.evaluate(()=>(window as any).fixtureState.renders[1])).toBe(1);
    await header(page,1).click();
    await expect(row(page,1).getByRole('textbox')).toHaveValue('Keep this state');
    await expect(row(page,1).getByRole('button',{name:'Count 1',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>(window as any).savedPaneBody===document.querySelector('[data-index="1"] .pane-body'))).toBe(true);
    await header(page,1).click();await page.waitForTimeout(60);await header(page,1).click();await page.waitForTimeout(240);
    await expect(row(page,1).getByRole('textbox')).toHaveValue('Keep this state');
    expect(await page.evaluate(()=>(window as any).fixtureState.renders[1])).toBe(1);
  }
  await sameState(pages);
});
test('Pane Toolbar and More Actions do not collapse the header',async({context},info)=>{
  const pages=await pair(context);
  for(const page of pages){await header(page,0).hover();await row(page,0).getByRole('button',{name:'Refresh',exact:true}).click();expect(await page.evaluate(()=>(window as any).fixturePanes[0].isExpanded())).toBe(true);}
  await sameState(pages);await equalPixels(pages,info,'action-click',0);
  for(const page of pages){await header(page,0).hover();await row(page,0).getByRole('button',{name:'More Actions...',exact:true}).click();}
  await sameState(pages);
  for(const page of pages){await page.waitForTimeout(150);await page.getByRole('menuitem',{name:'Configure View',exact:true}).click();expect(await page.evaluate(()=>(window as any).fixturePanes[0].isExpanded())).toBe(true);}
  await sameState(pages);
  for(const page of pages){await header(page,0).focus();await page.keyboard.press('Tab');await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');}
  // Keyboard focus schedules the source hover; sample the same settled state on both pages.
  for(const page of pages)await expect(page.locator('.monaco-hover').filter({hasText:'Collapse All'})).toBeVisible();
  await sameState(pages);await equalPixels(pages,info,'action-keyboard',0);
  for(const page of pages){await header(page,7).focus();await row(page,7).getByRole('button',{name:'More Actions...',exact:true}).click();expect(await page.evaluate(()=>(window as any).fixturePanes[7].isExpanded())).toBe(false);await page.keyboard.press('Escape');}
  await sameState(pages);
});
