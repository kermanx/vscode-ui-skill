// Native QuickInputService controls; local providers supply the same demo commands and files.
import {createQuickInputHost} from './quick-input-host';
import {quickInitial,quickMode,quickProps,quickKey,profilePrompt,profileError,lineTarget,type WorkbenchQuickMode} from '../../components/stories/WorkbenchQuickData';
import {KeyCodeUtils} from '../../vscode/src/vs/base/common/keyCodes.js';
import {KeyCodeChord} from '../../vscode/src/vs/base/common/keybindings.js';
import {OS} from '../../vscode/src/vs/base/common/platform.js';
import {USLayoutResolvedKeybinding} from '../../vscode/src/vs/platform/keybinding/common/usLayoutResolvedKeybinding.js';
import Severity from '../../vscode/src/vs/base/common/severity.js';
export function mountWorkbenchQuick(root:HTMLElement,surface:HTMLElement,host:{lines:()=>string[];focus:()=>void;accept:(mode:WorkbenchQuickMode,value:string[]|string)=>void;navigate:(line:number,column:number)=>void}){
 surface.style.position='relative';
 const service=createQuickInputHost(surface,()=>{}, {themeRoot:root,focus:host.focus});
 let current:any;
 function show(requested:WorkbenchQuickMode){
  current?.dispose();
  const initial=quickInitial(requested);
  if(requested==='input'){
   const input=current=service.createInputBox();input.title='New Workspace Profile';input.placeholder='Profile name';input.prompt=profilePrompt;
   input.onDidChangeValue(()=>{input.validationMessage=undefined;input.severity=Severity.Ignore;});
   input.onDidAccept(()=>{const error=profileError(input.value);if(error){input.validationMessage=error;input.severity=Severity.Error;return;}const value=input.value.trim();input.hide();queueMicrotask(()=>host.accept('input',value));});input.show();return;
  }
  const pick=current=service.createQuickPick({useSeparators:true});let mode=requested;
  let previousItems:unknown;
  function update(value:string){
   mode=quickMode(requested,value);const spec=quickProps(mode,value,host.lines());const {items,...rest}=spec;Object.assign(pick,rest);
   if(items!==previousItems){previousItems=items;pick.items=items.map(item=>item.type==='separator'?item:{...item,iconClass:item.icon&&`codicon codicon-${item.icon}`,keybinding:item.keybinding&&new USLayoutResolvedKeybinding(item.keybinding.map(chord=>new KeyCodeChord(!!chord.ctrlKey,!!chord.shiftKey,!!chord.altKey,!!chord.metaKey,KeyCodeUtils.fromString(chord.key||''))),OS)});}
  }
  pick.value=initial;pick.valueSelection=[initial.length,initial.length];update(initial);pick.onDidChangeValue(update);
  pick.onDidAccept(()=>{
   if(mode==='line'){const target=lineTarget(pick.value,host.lines());if(!target.line)return;pick.hide();queueMicrotask(()=>host.navigate(target.line!,target.column!));return;}
   const ids=pick.selectedItems.map((item:any)=>item.id);const acceptedMode=mode;pick.hide();queueMicrotask(()=>host.accept(acceptedMode,ids));
  });pick.show();
 }
 window.addEventListener('keydown',event=>{if(event.defaultPrevented)return;const mode=quickKey(event);if(mode){event.preventDefault();show(mode);}});
 return {show};
}
