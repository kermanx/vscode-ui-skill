import {test,expect,type BrowserContext,type Page} from '@playwright/test';
import {menuPixels} from './menu-fixture';
import {settleFixturePaint} from './paint';
test.use({viewport:{width:1100,height:720}});test.setTimeout(90000);
async function pair(context:BrowserContext,theme='dark'){
 const pages=[await context.newPage(),await context.newPage()];
 await pages[0].goto(`/reference/index.html?kind=workbench&theme=${theme}&demo=true`);
 await pages[1].goto(`/iframe.html?id=compositions-workbench--specimen&viewMode=story&globals=theme:${theme}&demo=true`);
 for(const page of pages){page.on('pageerror',e=>expect(e.message).toBe(''));await page.waitForFunction(()=>(window as any).fixtureReady);await page.evaluate(()=>document.fonts.ready);await page.locator('[data-workbench-content="editor"]').click();}
 return pages;
}
const widget=(page:Page)=>page.locator('.quick-input-widget:visible');
const input=(page:Page)=>widget(page).locator('.quick-input-box input');
async function show(pages:Page[],mode:string){for(const page of pages){await page.evaluate(mode=>(window as any).fixtureApi.quickOpen(mode),mode);await expect(input(page)).toBeFocused();await page.mouse.move(1090,710);}}
async function pixels(pages:Page[],info:any,name:string){for(const page of pages){await page.mouse.move(1090,710);await page.waitForTimeout(250);await settleFixturePaint(page,'filter','.quick-input-widget:not([style*="display: none"])');}await menuPixels(pages,info,name,'.quick-input-widget:visible');}
for(const theme of ['dark','light','hcDark','hcLight'])test(`Workbench quick surfaces / ${theme}`,async({context},info)=>{
 const pages=await pair(context,theme);
 for(const mode of ['files','commands','line','input','choice','multi']){await show(pages,mode);await pixels(pages,info,mode);for(const page of pages){const rect=await widget(page).boundingBox();expect(rect!.y).toBe(0);expect(Math.round(rect!.x)).toBe(250);await page.keyboard.press('Escape');await expect(widget(page)).toHaveCount(0);await expect(page.locator('[data-workbench-content="editor"]')).toBeFocused();}}
});
test('Workbench Quick Access routes prefixes, filters, runs commands and opens files',async({context},info)=>{
 const pages=await pair(context);
 for(const page of pages){await page.keyboard.press('Meta+p');await expect(input(page)).toBeFocused();await input(page).fill('pack');await expect(widget(page).locator('.monaco-list-row')).toHaveCount(1);}
 await pixels(pages,info,'file-filter');for(const page of pages){await page.keyboard.press('Enter');await expect(page.locator('.part.editor .tab.active')).toContainText('package.json');await expect(page.locator('[data-workbench-content="editor"]')).toBeFocused();await page.keyboard.press('Meta+Shift+p');await expect(input(page)).toHaveValue('>');await input(page).fill('>Toggle Panel');}
 await pixels(pages,info,'command-filter');for(const page of pages){await page.keyboard.press('Enter');await expect(page.locator('[data-workbench-content="panel"]')).toBeHidden();await page.keyboard.press('F1');await input(page).fill('pack');await expect(widget(page)).toContainText('package.json');await input(page).fill(':3:2');}
 await pixels(pages,info,'prefix-line');for(const page of pages){await page.keyboard.press('Enter');await expect(page.locator('[data-workbench-content="editor"]')).toHaveAttribute('data-line','3');await expect(page.locator('.statusbar')).toContainText('Ln 3, Col 2');}
});
test('Workbench input validation, single selection, multiselect and focus dismissal',async({context},info)=>{
 const pages=await pair(context);
 await show(pages,'input');for(const page of pages)await page.keyboard.press('Enter');await pixels(pages,info,'validation');for(const page of pages){await expect(widget(page)).toContainText('A profile name is required.');await input(page).fill('Frontend');await page.keyboard.press('Enter');await expect(page.locator('[data-workbench-content="panel"]')).toHaveText('Profile created: Frontend');}
 await show(pages,'choice');for(const page of pages){await input(page).fill('JSON');await page.keyboard.press('Enter');await expect(page.locator('.statusbar-item').filter({has:page.locator('[aria-label="JSON"]')})).toBeVisible();}
 await show(pages,'multi');for(const page of pages){await widget(page).getByRole('checkbox',{name:'Format on Save',exact:true}).click();await widget(page).getByRole('checkbox',{name:'Linting',exact:true}).click();}await pixels(pages,info,'multiselect');for(const page of pages){await widget(page).getByRole('button',{name:'OK',exact:true}).click();await expect(page.locator('[data-workbench-content="panel"]')).toHaveText('Workspace features: format, lint');}
 await show(pages,'files');for(const page of pages){await page.locator('[data-workbench-content="editor"]').click();await expect(widget(page)).toHaveCount(0);await expect(page.locator('[data-workbench-content="editor"]')).toBeFocused();}
});
test('Workbench quick input stays centered when viewport resizes and status opens pickers',async({context},info)=>{
 const pages=await pair(context);for(const page of pages)await page.locator('.statusbar-item').filter({has:page.locator('[aria-label="Line 8, Column 12"]')}).click();await pixels(pages,info,'status-line');for(const page of pages){await page.setViewportSize({width:640,height:600});await input(page).fill(':9');}await pixels(pages,info,'narrow-line');for(const page of pages){await page.keyboard.press('Escape');await page.locator('.statusbar-item').filter({has:page.locator('[aria-label="TypeScript"]')}).click();await expect(input(page)).toHaveAttribute('placeholder','Select Language Mode');}
});
test('Workbench quick input closes when focus leaves its iframe',async({page})=>{
 await page.goto('/iframe.html?id=compositions-workbench--demo&viewMode=story&globals=theme:dark');
 await page.waitForFunction(()=>document.querySelectorAll('iframe').length===2&&[...document.querySelectorAll('iframe')].every(frame=>(frame.contentWindow as any).fixtureReady));
 for(const frame of page.frames().slice(1)){
  await frame.locator('[data-workbench-content="editor"]').click();
  await frame.evaluate(()=>(window as any).fixtureApi.quickOpen('commands'));
  await expect(frame.locator('.quick-input-widget:visible')).toBeVisible();
  await page.getByRole('button',{name:'并排对照',exact:true}).click();
  await expect(frame.locator('.quick-input-widget:visible')).toHaveCount(0);
 }
 await page.getByRole('button',{name:'命令面板',exact:true}).click();
 await expect(page.frames().at(-1)!.locator('.quick-input-widget:visible')).toBeVisible();
});
