import {test,expect,type BrowserContext,type Page} from '@playwright/test';
import {menuPixels} from './menu-fixture';
import {settleFixturePaint} from './paint';
test.use({viewport:{width:1100,height:720}});
test.setTimeout(120000);
const ids=['explorer','search','source-control','debug','extensions','testing','ports'];
async function pair(context:BrowserContext,theme='dark',side='left'){
 const pages=[await context.newPage(),await context.newPage()];
 await pages[0].goto(`/reference/index.html?kind=workbench&theme=${theme}&side=${side}&demo=true`);
 await pages[1].goto(`/iframe.html?id=compositions-workbench--specimen&viewMode=story&globals=theme:${theme}&side=${side}&demo=true`);
 for(const page of pages){await page.waitForFunction(()=>(window as any).fixtureReady);await page.evaluate(()=>document.fonts.ready);}
 return pages;
}
async function open(pages:Page[],id:string){for(const page of pages){await page.evaluate(id=>(window as any).fixtureApi.openView(id),id);await expect(page.locator('[data-activity-view]:visible')).toHaveCount(1);await expect(page.locator(`[data-activity-view="${id}"]`)).toBeVisible();await page.mouse.move(1090,710);}}
async function pixels(pages:Page[],info:any,name:string){const id=await pages[0].locator('[data-activity-view]:visible').getAttribute('data-activity-view');const selector=`[data-activity-view="${id}"]`;for(const page of pages){await page.waitForTimeout(250);await settleFixturePaint(page,'filter',selector);}await menuPixels(pages,info,name,selector);}
for(const theme of ['dark','light','hcDark','hcLight'])test(`Workbench all seven sidebars / ${theme}`,async({context},info)=>{
 const pages=await pair(context,theme);
 for(const id of ids){await open(pages,id);await pixels(pages,info,id);}
});
test('Workbench pane constraints, restore, sash and header navigation',async({context},info)=>{
 const pages=await pair(context);
 await open(pages,'debug');
 const sizes=(page:Page)=>page.locator('[data-activity-view="debug"] .split-view-view').evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().height));
 const initial=await sizes(pages[0]);expect(await sizes(pages[1])).toEqual(initial);
 for(const page of pages)await page.locator('[data-activity-view="debug"] .pane-header').first().click();
 for(const page of pages){await expect.poll(async()=>(await sizes(page))[0]).toBe(22);}
 await pixels(pages,info,'collapsed');
 for(const page of pages)await page.locator('[data-activity-view="debug"] .pane-header').first().click();
 for(const page of pages)await expect.poll(()=>sizes(page)).toEqual(initial);
 await pixels(pages,info,'restored');
 for(const page of pages){const header=page.locator('[data-activity-view="debug"] .pane-header');await header.first().focus();await page.keyboard.press('ArrowDown');await expect(header.nth(1)).toBeFocused();const sash=page.locator('[data-activity-view="debug"] .monaco-sash.horizontal').first();const box=(await sash.boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+42);await page.mouse.up();await page.mouse.move(1090,710);}
 expect(await sizes(pages[1])).toEqual(await sizes(pages[0]));expect((await sizes(pages[0]))[0]).not.toBe(initial[0]);await pixels(pages,info,'dragged');
 await open(pages,'extensions');await open(pages,'debug');expect(await sizes(pages[1])).toEqual(await sizes(pages[0]));
 for(const page of pages)await page.setViewportSize({width:900,height:620});await pixels(pages,info,'resized');
});
test('Workbench sidebars retain input and section state across switches',async({context},info)=>{
 const pages=await pair(context,'light','right');
 await open(pages,'extensions');for(const page of pages)await page.getByRole('textbox',{name:'Search Extensions',exact:true}).fill('Python');
 await open(pages,'source-control');for(const page of pages){await page.getByRole('textbox',{name:'Commit message',exact:true}).fill('Update sidebar');await expect(page.getByRole('button',{name:'Commit',exact:true})).toBeEnabled();}
 await open(pages,'extensions');for(const page of pages){await expect(page.getByRole('textbox',{name:'Search Extensions',exact:true})).toHaveValue('Python');await expect(page.locator('[data-activity-view="extensions"] .monaco-list-row')).toHaveCount(1);}
 await pixels(pages,info,'filtered-retained');await open(pages,'source-control');for(const page of pages)await expect(page.getByRole('textbox',{name:'Commit message',exact:true})).toHaveValue('Update sidebar');
});
test('Workbench activity clicks open and focus each corresponding sidebar',async({context})=>{
 const pages=await pair(context);
 const entries=[['Search','search'],['Source Control','source-control'],['Run and Debug','debug'],['Extensions','extensions'],['Testing','testing'],['Ports','ports'],['Explorer','explorer']];
 for(const [label,id] of entries)for(const page of pages){
  await page.locator('.activitybar').getByRole('tab',{name:new RegExp(`^${label}`)}).click();
  const view=page.locator(`[data-activity-view="${id}"]`);await expect(view).toBeVisible();await expect(page.locator('[data-activity-view]:visible')).toHaveCount(1);
  await expect.poll(()=>view.evaluate(element=>element.contains(document.activeElement))).toBe(true);
 }
});
