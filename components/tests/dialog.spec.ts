import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { settleFixturePaint } from './paint';
test.use({viewport:{width:800,height:700}});
async function pair(context:BrowserContext,theme='dark',index=0){
 const pages=[await context.newPage(),await context.newPage()];const errors:string[]=[];
 for(const page of pages)page.on('pageerror',error=>{errors.push(error.message);expect(error.message,'no asynchronous fixture errors').toBe('');});
 await pages[0].goto(`/reference/index.html?kind=dialog&theme=${theme}&case=${index}`);
 await pages[1].goto(`/iframe.html?id=components-dialog--specimen&viewMode=story&globals=theme:${theme}&case=${index}`);
 for(const page of pages){await page.waitForFunction(()=>(window as any).fixtureReady);await page.evaluate(()=>document.fonts.ready);await expect(page.getByRole('dialog')).toBeVisible();}
 expect(errors).toEqual([]);return pages;
}
async function show(pages:Page[],index:number){for(const page of pages)await page.evaluate(index=>(window as any).fixtureOpenDialog(index),index);}
async function equalPixels(pages:Page[],info:TestInfo,name:string){
 const buffers:Buffer[]=[];
 for(const page of pages){await page.bringToFront();await page.mouse.move(795,695);await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations===Infinity).forEach(a=>{a.pause();a.currentTime=300;}));await settleFixturePaint(page);buffers.push(await page.screenshot({caret:'hide'}));}
 const [a,b]=buffers.map(buffer=>PNG.sync.read(buffer));expect([b.width,b.height]).toEqual([a.width,a.height]);const diff=new PNG({width:a.width,height:a.height});const count=pixelmatch(a.data,b.data,diff.data,a.width,a.height,{threshold:0,includeAA:true});
 if(count)for(const [suffix,buffer] of [['original',buffers[0]],['replica',buffers[1]],['diff',PNG.sync.write(diff)]] as const)await info.attach(`${name}-${suffix}`,{body:buffer,contentType:'image/png'});
 expect(count,`${name} differing pixels`).toBe(0);
}
async function sameState(pages:Page[]){
 const states=await Promise.all(pages.map(page=>page.evaluate(()=>{
 const el=document.activeElement as HTMLElement;const box=document.querySelector('.monaco-dialog-box');
 const {results,actions,links}=(window as any).fixtureState;
 return {state:{results,actions,links},open:!!box,focus:el?.classList.contains('monaco-dialog-box')?'dialog':el?.tagName==='INPUT'?`input:${(el as HTMLInputElement).placeholder}`:el?.getAttribute('aria-label')||el?.textContent,
 buttons:[...document.querySelectorAll('.dialog-buttons .monaco-button')].map(b=>({label:b.textContent,role:b.getAttribute('role'),tab:b.getAttribute('tabindex')})),checkbox:document.querySelector('.monaco-checkbox')?.getAttribute('aria-checked'),
 inputs:[...document.querySelectorAll<HTMLInputElement>('.dialog-message-input input')].map(input=>({value:input.value,type:input.type,start:input.selectionStart,end:input.selectionEnd})),
 dialog:box?{label:box.getAttribute('aria-labelledby'),description:box.getAttribute('aria-describedby'),modal:box.getAttribute('aria-modal'),icon:box.querySelector('.dialog-icon')?.getAttribute('aria-label')}:undefined};
 })));
 expect(states[1]).toEqual(states[0]);return states[0];
}
for(const theme of ['dark','light','hcDark','hcLight'])test(`Dialog all content combinations / ${theme}`,async({context},info)=>{
 const pages=await pair(context,theme);for(let i=0;i<13;i++){if(i)await show(pages,i);await sameState(pages);await equalPixels(pages,info,`case-${i}`);}
});
test('Dialog inputs, checkbox, default button and cancellation values',async({context},info)=>{
 const pages=await pair(context,'dark',4);await sameState(pages);
 for(const page of pages){await page.getByPlaceholder('User name').fill('bob');await page.getByPlaceholder('Password').fill('changed');await page.locator('.dialog-checkbox-message').click();await page.getByPlaceholder('Password').focus();await page.keyboard.press('Enter');}
 let state=await sameState(pages);expect(state.state.results.at(-1).result).toEqual({button:0,checkboxChecked:false,values:['bob','changed']});
 await show(pages,11);for(const page of pages)await page.keyboard.press('Enter');state=await sameState(pages);expect(state.state.results.at(-1).result).toEqual({button:1,values:['example']});
 await show(pages,4);for(const page of pages)await page.keyboard.press('Escape');state=await sameState(pages);expect(state.state.results.at(-1).result).toEqual({button:1,checkboxChecked:true});
 await show(pages,1);for(const page of pages){await page.getByRole('checkbox').click();await page.getByRole('button',{name:'Delete',exact:true}).click();}await sameState(pages);
 await show(pages,4);for(const page of pages){await page.locator('.dialog-toolbar .action-label').click();}await sameState(pages);await equalPixels(pages,info,'closed');
});
test('Dialog focus cycle, trap and close-disabled behavior',async({context},info)=>{
 const pages=await pair(context,'dark',6);
 for(const key of ['Tab','Tab','Tab','Tab','Shift+Tab','ArrowLeft','ArrowRight']){for(const page of pages)await page.keyboard.press(key);await sameState(pages);}
 for(const page of pages)await page.getByRole('button',{name:'Move focus outside',exact:true}).focus();await sameState(pages);
 for(const page of pages)await page.keyboard.press('Escape');const state=await sameState(pages);expect(state.focus).toBe('Move focus outside');
 await show(pages,8);for(const page of pages){await page.keyboard.press('Escape');await page.keyboard.press('Tab');}await sameState(pages);for(const page of pages)await expect(page.getByRole('dialog')).toBeVisible();await equalPixels(pages,info,'pending');
 await show(pages,9);for(const page of pages){await expect(page.locator('.dialog-toolbar .action-label')).toHaveCount(0);await page.keyboard.up('Escape');await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');}await sameState(pages);
 await show(pages,4);for(const key of ['ArrowLeft','ArrowRight','Tab','Tab','Tab','Tab','Tab','Shift+Tab']){for(const page of pages)await page.keyboard.press(key);await sameState(pages);}
});
test('Dialog updateMessage preserves heading and rich content is replaced',async({context},info)=>{
 const pages=await pair(context,'dark',6);for(const page of pages)await page.evaluate(()=>(window as any).fixtureDialog.updateMessage('Updated detail text.'));await sameState(pages);await equalPixels(pages,info,'updated-detail');
 for(const page of pages){await expect(page.locator('.dialog-message-text')).toHaveText('Workspace trust');await expect(page.locator('.dialog-message-detail')).toHaveText('Updated detail text.');await page.evaluate(()=>(window as any).fixtureDialog.close());}await sameState(pages);
});
test('Dialog primary dropdown owns its external focus and resolves original primary button',async({context},info)=>{
 const pages=await pair(context,'dark',10);
 for(const page of pages)await page.getByRole('button',{name:'More Actions...',exact:true}).click();await sameState(pages);await equalPixels(pages,info,'dropdown-open');
 for(const page of pages){await page.waitForTimeout(150);await page.getByRole('menuitem',{name:'Keep Both',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);}let state=await sameState(pages);expect(state.state.actions).toEqual(['keep-both']);expect(state.state.results.at(-1).result).toEqual({button:0});
 await show(pages,10);for(const page of pages){await page.getByRole('button',{name:'More Actions...',exact:true}).click();await page.keyboard.press('Escape');}state=await sameState(pages);expect(state.state.results.at(-1).result).toEqual({button:1});
});
for(const platform of ['Macintosh','Linux','Windows'])test(`Dialog platform button ordering / ${platform}`,async({browser},info)=>{
 const context=await browser.newContext({viewport:{width:800,height:700},userAgent:`Mozilla/5.0 (${platform}) AppleWebKit/537.36 Chrome/133.0.0.0 Safari/537.36`});const pages=await pair(context,'dark',3);await sameState(pages);
 const labels=platform==='Windows'?['Save','Don’t Save','Cancel']:['Don’t Save','Cancel','Save'];for(const page of pages)expect(await page.locator('.dialog-buttons .monaco-button').allTextContents()).toEqual(labels);await equalPixels(pages,info,'button-order');
 for(const page of pages){if(platform==='Macintosh')await page.keyboard.press('Meta+d');else await page.getByRole('button',{name:'Don’t Save',exact:true}).click();}const state=await sameState(pages);expect(state.state.results.at(-1).result).toEqual({button:1});
 await show(pages,5);await sameState(pages);for(const page of pages)expect(await page.locator('.dialog-buttons .monaco-button').allTextContents()).toEqual(['Open Locally','Open Remotely','Cancel']);await context.close();
});
test('Dialog links, checkbox keyboard, backdrop and event propagation',async({context})=>{
 const pages=await pair(context,'dark',6);
 for(const page of pages){await page.locator('.dialog-message-detail a').click();await page.locator('.dialog-footer a').click();}
 let state=await sameState(pages);expect(state.state.links).toEqual(['detail','footer']);expect(state.open).toBe(true);
 for(const page of pages){await page.mouse.click(790,690);await expect(page.getByRole('dialog')).toBeVisible();}await sameState(pages);
 await show(pages,1);for(const page of pages){await page.getByRole('checkbox').focus();await page.keyboard.press('Space');}state=await sameState(pages);expect(state.checkbox).toBe('true');
 for(const index of [0,4,3]){
  await show(pages,index);
  for(const page of pages){await page.evaluate(()=>{(window as any).dialogEvents=[];for(const type of ['click','keydown','keyup'])window.addEventListener(type,event=>(window as any).dialogEvents.push({type,defaultPrevented:event.defaultPrevented,key:(event as KeyboardEvent).key}),{once:true});});
   if(index===0)await page.getByRole('button',{name:'Save',exact:true}).click();else if(index===4)await page.keyboard.press('Enter');else await page.keyboard.press('Meta+d');
  }
  await sameState(pages);const events=await Promise.all(pages.map(page=>page.evaluate(()=>(window as any).dialogEvents)));expect(events[1]).toEqual(events[0]);
 }
});

for(const timing of ['sync','nextTick'])test(`Dialog result callback can reopen / ${timing}`,async({page})=>{
 await page.goto('/iframe.html?id=components-dialog--specimen&viewMode=story&globals=theme:dark&case=4');await page.waitForFunction(()=>(window as any).fixtureReady);
 await page.getByPlaceholder('User name').fill('changed');
 await page.evaluate(timing=>{const fixture=window as any;fixture.fixtureOnDialogResult=()=>{delete fixture.fixtureOnDialogResult;const reopen=()=>fixture.fixtureSetDialogOpen(true);if(timing==='sync')reopen();else void fixture.fixtureAfterTick(reopen);};},timing);
 await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByPlaceholder('User name')).toHaveValue('alice');await expect(page.getByPlaceholder('User name')).toBeFocused();
 expect(await page.evaluate(()=>(window as any).fixtureState.results)).toEqual([{index:4,result:{button:0,checkboxChecked:true,values:['changed','secret']}}]);
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('[data-open="4"]')).toBeFocused();
 expect(await page.evaluate(()=>(window as any).fixtureState.results.length)).toBe(2);
});
