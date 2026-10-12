import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { settleFixturePaint } from './paint';
import { menuPixels } from './menu-fixture';
test.use({viewport:{width:1100,height:850}});
const errors=new WeakMap<Page,string[]>();
async function pair(context:BrowserContext,theme='dark',query=''){
 const pages=[await context.newPage(),await context.newPage()];for(const page of pages){const list:string[]=[];errors.set(page,list);page.on('pageerror',error=>list.push(error.message));}
 await pages[0].goto(`/reference/index.html?kind=settings&theme=${theme}${query}`);
 await pages[1].goto(`/iframe.html?id=components-settings--specimen&viewMode=story&globals=theme:${theme}${query}`);
 for(const page of pages){await page.waitForFunction(()=>(window as any).fixtureReady);await page.evaluate(()=>document.fonts.ready);await page.mouse.move(1090,840);}
 return pages;
}
const field=(page:Page,key:string)=>page.locator(`[data-key="${key}"] input,[data-key="${key}"] textarea`);
async function state(page:Page){return page.evaluate(()=>{const s=(window as any).fixtureState;return{query:s.query,target:s.target,category:s.category,values:s.values,changes:s.changes,opens:s.opens,copies:s.copies,allProfiles:s.allProfiles};});}
async function equal(pages:Page[]){for(const page of pages)expect(errors.get(page)).toEqual([]);await expect.poll(async()=>({reference:await state(pages[0]),vue:await state(pages[1])})).toEqual({reference:await state(pages[0]),vue:await state(pages[0])});}
async function pixels(pages:Page[],info:any,name:string,selector?:string){for(const page of pages){await page.mouse.move(1090,840);await page.waitForTimeout(1400);await page.evaluate(()=>Promise.all(document.getAnimations().filter(animation=>animation.effect?.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{}))));}await menuPixels(pages,info,name,selector);}
for(const theme of ['dark','light','hcDark','hcLight'])test(`Settings scalar rows and target tabs / ${theme}`,async({context},info)=>{const pages=await pair(context,theme);await equal(pages);await pixels(pages,info,'initial');for(const page of pages)await field(page,'editor.fontSize').focus();await pixels(pages,info,'number-focus');for(const page of pages)await page.getByRole('tab',{name:'Workspace',exact:true}).click();await equal(pages);await pixels(pages,info,'workspace');});
test('Settings validation, editing and reset preserve emitted values',async({context},info)=>{const pages=await pair(context);for(const page of pages)await field(page,'editor.fontSize').fill('3');await equal(pages);expect((await state(pages[0])).changes).toEqual([]);await pixels(pages,info,'validation');for(const page of pages)await field(page,'editor.fontSize').fill('18');await equal(pages);expect((await state(pages[0])).changes).toEqual([{key:'editor.fontSize',value:18,target:'user',manualReset:false}]);for(const page of pages)await page.locator('[data-key="editor.fontSize"] .setting-item-title').hover();for(const page of pages)await page.locator('[data-key="editor.fontSize"] .codicon-settings-more-action').click();await menuPixels(pages,info,'row-menu','.monaco-menu-container');for(const page of pages){await page.waitForTimeout(120);await page.getByRole('menuitem',{name:/Reset Setting$/}).click();}await equal(pages);expect((await state(pages[0])).values.user['editor.fontSize']).toBeUndefined();});
test('Settings filtering, empty results and category selection',async({context},info)=>{const pages=await pair(context);for(const query of ['font','@modified','@id:editor.fontFamily','nonexistent-setting']){for(const page of pages)await page.evaluate(query=>(window as any).fixtureApi.query(query),query);for(const page of pages)await expect.poll(()=>page.evaluate(()=>(window as any).fixtureState.query)).toBe(query);await equal(pages);await pixels(pages,info,`query-${query}`);}for(const page of pages){await page.evaluate(()=>(window as any).fixtureApi.query(''));await page.waitForTimeout(250);await page.locator('.settings-toc-entry',{hasText:'Files'}).click();}await equal(pages);await pixels(pages,info,'files-category');});
test('Settings enum popup and boolean description interaction',async({context},info)=>{const pages=await pair(context);for(const page of pages)await page.locator('[data-key="editor.wordWrap"] select').click();await menuPixels(pages,info,'enum-open','.monaco-select-box-dropdown-container');for(const page of pages){await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');}await equal(pages);for(const page of pages){await page.evaluate(()=>(window as any).fixtureApi.reveal('editor.renderWhitespace'));await page.locator('[data-key="editor.renderWhitespace"] .setting-item-description').click();}await equal(pages);expect((await state(pages[0])).values.user['editor.renderWhitespace']).toBe(true);});
test('Settings search filter menu toggles modified settings',async({context},info)=>{const pages=await pair(context);for(const page of pages)await page.getByRole('button',{name:'Filter Settings',exact:true}).click();await menuPixels(pages,info,'filter-menu','.monaco-menu-container');for(const page of pages){await page.waitForTimeout(120);await page.getByRole('menuitemcheckbox',{name:/Modified$/}).click();await page.waitForTimeout(250);}await equal(pages);expect((await state(pages[0])).query).toBe('@modified');});
test('Settings multiline, deprecation and JSON host event',async({context},info)=>{const pages=await pair(context);for(const page of pages)await page.locator('.settings-toc-entry',{hasText:'Files'}).click();for(const page of pages)await field(page,'files.header').fill('First line\nSecond line\nThird line');await equal(pages);await pixels(pages,info,'multiline');for(const page of pages)await page.getByRole('button',{name:'Edit in settings.json: files.excludeRules'}).click();await equal(pages);expect((await state(pages[0])).opens).toEqual(['files.excludeRules']);});
test('Settings narrow layout hides the TOC and preserves controls',async({context},info)=>{const pages=await pair(context,'dark','&width=620');await equal(pages);await pixels(pages,info,'narrow');for(const page of pages)await expect(page.locator('.settings-toc-container')).not.toBeVisible();});

test('Settings scope links, profile action and copied setting data',async({context},info)=>{const pages=await pair(context);for(const page of pages){await page.getByRole('tab',{name:'Workspace',exact:true}).click();await page.locator('[data-key="editor.fontSize"] .modified-scope').click();await page.waitForTimeout(250);}await equal(pages);expect((await state(pages[0])).query).toBe('@id:editor.fontSize ');for(const page of pages){await page.locator('[data-key="editor.fontSize"] .setting-item-title').hover();await page.locator('[data-key="editor.fontSize"] .codicon-settings-more-action').click();await page.waitForTimeout(120);await page.getByRole('menuitemcheckbox',{name:'Apply Setting to all Profiles',exact:true}).click();}await equal(pages);expect((await state(pages[0])).allProfiles).toEqual(['editor.fontSize']);for(const page of pages){await page.locator('[data-key="editor.fontSize"] .setting-item-title').hover();await page.locator('[data-key="editor.fontSize"] .codicon-settings-more-action').click();await page.waitForTimeout(120);await page.getByRole('menuitem',{name:'Copy Setting as JSON',exact:true}).click();}await equal(pages);expect((await state(pages[0])).copies).toEqual(['"editor.fontSize": 16']);});
test('Settings TOC keyboard selection changes category',async({context},info)=>{const pages=await pair(context);for(const page of pages)await page.locator('.settings-toc-container .monaco-list').first().focus();for(const key of ['ArrowDown','ArrowDown','Home','End']){for(const page of pages)await page.keyboard.press(key);await equal(pages);}await pixels(pages,info,'toc-keyboard');});
test('Settings sash and responsive layout preserve source dimensions',async({context},info)=>{const pages=await pair(context);for(const page of pages){const sash=page.locator('.settings-body .monaco-sash.vertical').first();const box=await sash.boundingBox();await page.mouse.move(box!.x+box!.width/2,box!.y+180);await page.mouse.down();await page.mouse.move(box!.x+box!.width/2+84,box!.y+180,{steps:5});await page.mouse.up();}await pixels(pages,info,'resized-toc');for(const page of pages)await page.locator('.settings-body .monaco-sash.vertical').first().dblclick();await pixels(pages,info,'reset-toc');for(const size of [[620,520],[900,620]]){for(const page of pages)await page.evaluate(([width,height])=>(window as any).fixtureApi.resize(width,height),size);await pixels(pages,info,`size-${size.join('-')}`);}});
test('Settings search IME suspension preserves focus and the selected range',async({context},info)=>{
 const pages=await pair(context);
 for(const page of pages){
  const sink=page.locator('.ime-text-area');
  await expect(sink).toHaveAttribute('tabindex','-1');await expect(sink).toHaveAttribute('aria-hidden','true');await expect(sink).not.toBeFocused();
  await page.evaluate(()=>(window as any).fixtureApi.setSearchImeEnabled(false));
  await expect(sink).not.toBeFocused();await expect(sink).toHaveJSProperty('readOnly',true);
  await page.mouse.move(1090,840);await page.waitForTimeout(1400);
  await settleFixturePaint(page,'filter');
 }
 await pixels(pages,info,'search-ime-suspended');
 for(const page of pages){
  await page.evaluate(()=>{(window as any).fixtureApi.setSearchImeEnabled(true);(window as any).fixtureApi.focus();});
  await page.keyboard.type('font');await page.keyboard.press('Home');await page.keyboard.press('Shift+ArrowRight');await page.keyboard.press('Shift+ArrowRight');
  await page.evaluate(()=>(window as any).fixtureApi.setSearchImeEnabled(false));await expect(page.locator('.ime-text-area')).toBeFocused();await page.keyboard.type('Z');
  await expect.poll(()=>state(page).then(state=>state.query)).toBe('font');
  await page.evaluate(()=>(window as any).fixtureApi.setSearchImeEnabled(true));await page.keyboard.type('x');
  await expect.poll(()=>state(page).then(state=>state.query)).toBe('xnt');
  await page.evaluate(()=>(document.activeElement as HTMLElement).blur());
  await page.mouse.move(1090,840);await page.waitForTimeout(1400);
  await settleFixturePaint(page,'filter');
 }
 await equal(pages);await pixels(pages,info,'search-ime-restored');
 for(const page of pages){
  await page.evaluate(()=>{(window as any).fixtureApi.query('');(window as any).fixtureApi.focus();});
  await expect.poll(()=>state(page).then(state=>state.query)).toBe('');
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.imeSetComposition',{text:'中文',selectionStart:2,selectionEnd:2});await cdp.send('Input.insertText',{text:'中文'});
  await expect.poll(()=>state(page).then(state=>state.query)).toBe('中文');await cdp.detach();
 }
 await equal(pages);
});
