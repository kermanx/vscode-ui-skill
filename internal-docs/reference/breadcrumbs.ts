// Independent oracle: actual BreadcrumbsWidget + IconLabel with workbench caller styles.
import { BreadcrumbsWidget, BreadcrumbsItem } from '../../vscode/src/vs/base/browser/ui/breadcrumbs/breadcrumbsWidget.js';
import { IconLabel } from '../../vscode/src/vs/base/browser/ui/iconLabel/iconLabel.js';
import { Codicon } from '../../vscode/src/vs/base/common/codicons.js';
import { defaultBreadcrumbsWidgetStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { ScrollbarVisibility } from '../../vscode/src/vs/base/common/scrollable.js';
import { Dimension } from '../../vscode/src/vs/base/browser/dom.js';
import '../../vscode/src/vs/workbench/browser/parts/editor/media/editortitlecontrol.css';
import '../../vscode/src/vs/workbench/browser/parts/editor/media/breadcrumbscontrol.css';
import '../../vscode/src/vs/workbench/contrib/codeEditor/browser/outline/documentSymbolsTree.css';
import '../../vscode/src/vs/editor/contrib/symbolIcons/browser/symbolIcons.css';
import { breadcrumbExamples, breadcrumbEventText } from '../../components/stories/BreadcrumbsData';
import type { BreadcrumbItem } from '../../components/src/components/breadcrumbs/types';
class Item extends BreadcrumbsItem {
  label?: IconLabel;
  constructor(readonly data: BreadcrumbItem) {super();}
  dispose() {this.label?.dispose();}
  equals(other: BreadcrumbsItem) {return other instanceof Item && JSON.stringify(this.data) === JSON.stringify(other.data);}
  render(container: HTMLElement) {
    const symbol = this.data.kind === 'symbol';
    if (this.data.kind === 'file' || this.data.kind === 'folder') container.classList.add(this.data.kind);
    if (symbol) {container.classList.add('outline-element'); if(this.data.icon){const icon=document.createElement('div');icon.className=`outline-element-icon inline codicon-colored codicon codicon-${this.data.icon}`;container.append(icon);}}
    this.label = new IconLabel(container,{supportHighlights:symbol});
    this.label.setLabel(this.data.label,this.data.description,{extraClasses:[...(symbol?['nowrap']:[]),...(this.data.deprecated?['deprecated']:[])],iconPath:!symbol && this.data.icon ? {id:this.data.icon}:undefined,labelEscapeNewLines:symbol});
    if(symbol){const decoration=document.createElement('div');decoration.className='outline-element-decoration';container.append(decoration);}
  }
}
export function mountBreadcrumbs(root: HTMLElement, surface: HTMLElement, state: any) {
  surface.className='specimen';surface.style.cssText='display:flex;flex-direction:column;gap:12px;padding:4px;box-sizing:border-box';
  Object.assign(state,{events:[],focus:[]});
  const widgets = breadcrumbExamples.map((example,index)=>{
    const host=document.createElement('div');host.dataset.index=String(index);host.style.width='300px';surface.append(host);
    host.innerHTML='<div class="part editor"><div class="content"><div class="editor-group-container"><div class="title"><div class="breadcrumbs-below-tabs"><div class="breadcrumbs-control"></div></div></div></div></div></div>';
    const control=host.querySelector<HTMLElement>('.breadcrumbs-control')!;
    const widget=new BreadcrumbsWidget(control,example.scrollbarSize==='large'?8:3,example.scrollbarVisibility==='hidden'?ScrollbarVisibility.Hidden:example.scrollbarVisibility==='visible'?ScrollbarVisibility.Visible:ScrollbarVisibility.Auto,Codicon.chevronRight,defaultBreadcrumbsWidgetStyles);
    widget.setItems(example.items.map(item=>new Item(item)));widget.setEnabled(!example.disabled);widget.layout(new Dimension(300,22));
    widget.onDidFocusItem(event=>state.events.push(breadcrumbEventText(index,{...event,item:(event.item as Item)?.data})));
    widget.onDidSelectItem(event=>state.events.push(breadcrumbEventText(index,{...event,item:(event.item as Item)?.data})));
    widget.onDidChangeFocus(focus=>state.focus.push(`${index}:${focus}`));
    control.addEventListener('keydown',event=>{
      const mac=/Mac/.test(navigator.platform),plain=!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey;
      const nav=!event.shiftKey&&!event.metaKey&&(mac?event.altKey&&!event.ctrlKey:event.ctrlKey&&!event.altKey);
      if((plain||nav)&&event.key==='ArrowLeft')widget.focusPrev();
      else if((plain||nav)&&event.key==='ArrowRight')widget.focusNext();
      else if(plain&&['Enter','ArrowDown'].includes(event.key))widget.setSelection(widget.getFocused(),'pick');
      else if(plain&&event.key===' '||event.key==='Enter'&&!event.shiftKey&&!event.altKey&&(mac?event.metaKey&&!event.ctrlKey:event.ctrlKey&&!event.metaKey))widget.setSelection(widget.getFocused(),'reveal');
      else if(plain&&event.key==='Escape'){widget.setFocused(undefined);widget.setSelection(undefined);root.querySelector<HTMLButtonElement>('.outside')?.focus();}
      else return;event.preventDefault();event.stopPropagation();
    });
    return widget;
  });
  (window as any).fixtureBreadcrumbs=widgets.map(widget=>({
    focus:()=>widget.domFocus(),getFocused:()=> (widget.getFocused() as Item)?.data,getSelection:()=> (widget.getSelection() as Item)?.data,
    setFocused:(id?:string,payload?:unknown)=>widget.setFocused(widget.getItems().find(item=>(item as Item).data.id===id),payload),
    setSelection:(id?:string,payload?:unknown)=>widget.setSelection(widget.getItems().find(item=>(item as Item).data.id===id),payload),
    reveal:(id:string)=>widget.reveal(widget.getItems().find(item=>(item as Item).data.id===id)!),revealLast:()=>widget.revealLast(),
    layout:()=>widget.layout(new Dimension((widget as any)._domNode.parentElement.parentElement.clientWidth,22)),
  }));
  (window as any).fixtureSetItems=(index:number,items:BreadcrumbItem[])=>widgets[index].setItems(items.map(item=>new Item(item)));
}
