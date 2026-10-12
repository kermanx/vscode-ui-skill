// Independent oracle: original Dialog and its actual ButtonBar/Checkbox/InputBox composition.
import { Dialog, DialogContentsAlignment } from '../../vscode/src/vs/base/browser/ui/dialog/dialog.js';
import { defaultDialogStyles,defaultButtonStyles,defaultCheckboxStyles,defaultInputBoxStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { ContextView,ContextViewDOMPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { toAction,Separator } from '../../vscode/src/vs/base/common/actions.js';
import { getIconsStyleSheet } from '../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js';
import { dialogExamples,dialogProps } from '../../components/stories/DialogData';
export function mountDialog(root:HTMLElement,surface:HTMLElement,state:any){
  const iconStyle=document.createElement('style');iconStyle.textContent=getIconsStyleSheet(undefined).getCSS();document.head.append(iconStyle);
  surface.className='specimen';surface.style.cssText='display:grid;grid-template-columns:repeat(2,230px);gap:8px;padding:4px;box-sizing:border-box';
  Object.assign(state,{results:[],actions:[],links:[]});
  const popupHost=document.createElement('div');root.append(popupHost);
  const view=new ContextView(popupHost,ContextViewDOMPosition.FIXED);
  window.addEventListener('resize', () => view.layout());
  const provider={showContextView:delegate=>view.show(delegate),hideContextView:data=>view.hide(data)} as any;
  const handler=new ContextMenuHandler(provider,{publicLog2(){}} as any,{error:console.error} as any,{lookupKeybinding:()=>undefined} as any);
  let current:Dialog|undefined;
  function link(label:string,id:string){const a=document.createElement('a');a.href=`#${id}`;a.textContent=label;a.addEventListener('click',event=>{event.preventDefault();state.links.push(id);});return a;}
  async function show(index:number){
    if(current){current.dispose();current=undefined;await Promise.resolve();}
    root.querySelector<HTMLButtonElement>(`[data-open="${index}"]`)?.focus();
    const example=dialogExamples[index],props=dialogProps(example);
    let detailElement:HTMLElement|undefined;
    if(example.richDetail){detailElement=document.createElement('p');detailElement.style.margin='0';detailElement.append('Only trust code from authors you know. ',link('Learn about workspace trust','detail'),'.');}
    const dialog=current=new Dialog(root,props.message,props.buttons?.map(button=>typeof button==='string'?button:button.label),{
      ...props,alignment:props.alignment==='vertical'?DialogContentsAlignment.Vertical:DialogContentsAlignment.Horizontal,
      inputs:props.inputs?[...props.inputs]:undefined,detailElement,
      buttonOptions:props.buttons?.map(button=>typeof button==='string'?undefined:{sublabel:button.sublabel}),
      primaryButtonDropdown:props.primaryActions?{contextMenuProvider:handler as any,actions:props.primaryActions.map(action=>'separator'in action?new Separator():toAction({id:action.id,label:action.label,enabled:!action.disabled,run:async()=>{state.actions.push(action.id);}}))}:undefined,
      // The escape hatch is limited to this dialog's owned ContextView; unrelated focus is trapped.
      isExternalFocusAllowed:target=>popupHost.contains(target),
      renderBody:example.customBody?container=>{const text=document.createElement('p');text.style.margin='0';text.textContent='The configuration will apply to this workspace.';const links=document.createElement('p');links.style.margin='8px 0 0';links.append(link('View settings','body'));container.append(text,links);}:undefined,
      renderFooter:example.footer?container=>container.append(link('Learn more','footer')):undefined,
      buttonStyles:defaultButtonStyles,checkboxStyles:defaultCheckboxStyles,inputBoxStyles:defaultInputBoxStyles,dialogStyles:defaultDialogStyles,
    });
    (window as any).fixtureDialog={updateMessage:(message:string)=>dialog.updateMessage(message),close:()=>dialog.dispose(),focus:()=>root.querySelector<HTMLElement>('.monaco-dialog-box')?.focus()};
    void dialog.show().then(result=>{state.results.push({index,result});dialog.dispose();if(current===dialog)current=undefined;});
    await new Promise(requestAnimationFrame);
  }
  dialogExamples.forEach((example,index)=>{const button=document.createElement('button');button.className='outside';button.dataset.open=String(index);button.style.cssText='margin:0;text-align:left';button.textContent=example.name;button.addEventListener('click',()=>void show(index));surface.append(button);});
  (window as any).fixtureOpenDialog=show;
  void show(Number(new URLSearchParams(location.search).get('case')||0));
}
