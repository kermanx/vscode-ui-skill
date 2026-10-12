// Native shell composition: real CompositePart, ViewPane, PaneView and widgets.
// The data represents local demonstration snapshots, not connected workbench services.
import { PaneView } from '../../vscode/src/vs/base/browser/ui/splitview/paneview.js';
import { ViewPane } from '../../vscode/src/vs/workbench/browser/parts/views/viewPane.js';
import { CompositePart } from '../../vscode/src/vs/workbench/browser/parts/compositePart.js';
import { WorkbenchToolBar } from '../../vscode/src/vs/platform/actions/browser/toolbar.js';
import { ObjectTree } from '../../vscode/src/vs/base/browser/ui/tree/objectTree.js';
import { RenderIndentGuides } from '../../vscode/src/vs/base/browser/ui/tree/abstractTree.js';
import { IconLabel } from '../../vscode/src/vs/base/browser/ui/iconLabel/iconLabel.js';
import { ActionBar } from '../../vscode/src/vs/base/browser/ui/actionbar/actionbar.js';
import { InputBox } from '../../vscode/src/vs/base/browser/ui/inputbox/inputBox.js';
import { Button } from '../../vscode/src/vs/base/browser/ui/button/button.js';
import { Action } from '../../vscode/src/vs/base/common/actions.js';
import { Event } from '../../vscode/src/vs/base/common/event.js';
import { Color } from '../../vscode/src/vs/base/common/color.js';
import { InMemoryStorageService } from '../../vscode/src/vs/platform/storage/common/storage.js';
import { getBaseLayerHoverDelegate } from '../../vscode/src/vs/base/browser/ui/hover/hoverDelegate2.js';
import { ContextView, ContextViewDOMPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { defaultListStyles, defaultInputBoxStyles, defaultButtonStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { workbenchView, type WorkbenchSection } from '../../components/stories/WorkbenchViewsData';
import type { TreeNode } from '../../components/src/components/tree/types';
import '../../components/stories/workbenchViews.css';

export function mountWorkbenchSidebar(root:HTMLElement,surface:HTMLElement,id:string,height:number) {
  const config=workbenchView(id);
  surface.className='part sidebar workbench-sidebar-view';surface.dataset.sidebarView=id;
  const keys={lookupKeybinding:()=>undefined};
  const hover=getBaseLayerHoverDelegate();
  const contextView=new ContextView(root,ContextViewDOMPosition.FIXED);
  const menus=new ContextMenuHandler({showContextView:(delegate:any)=>contextView.show(delegate),hideContextView:(data:any)=>contextView.hide(data)} as any,{publicLog2(){}} as any,{error:console.error} as any,keys as any);
  const theme:any={getColorTheme:()=>({getColor:(name:string)=>Color.Format.CSS.parse(getComputedStyle(root).getPropertyValue(`--vscode-${name.replaceAll('.','-')}`).trim())||undefined}),onDidColorThemeChange:Event.None};
  const contexts:any={createScoped:()=>contexts,createKey:(_id:string,value:any)=>({set:(next:any)=>value=next,get:()=>value,reset(){}}),onDidChangeContext:Event.None,contextMatchesRules:()=>true,dispose(){}};
  const descriptors:any={getViewLocationById:()=>0,onDidChangeLocation:Event.None,getViewContainerByViewId:()=>({id}),getDefaultContainerById:()=>({id}),getViewContainerModel:()=>({title:config.title,onDidChangeContainerInfo:Event.None}),getViewDescriptorById:()=>undefined};
  const settings:any={onDidChangeConfiguration:Event.None,getValue:()=>false};
  const instantiation:any={dispose(){},createChild:()=>instantiation,createInstance:(Ctor:any,...args:any[])=>{
    if(Ctor===WorkbenchToolBar)return new Ctor(args[0],args[1],{} as any,{} as any,menus as any,keys as any,{} as any,{publicLog2(){}} as any);
    if(Ctor.name==='ViewMenuActions')return {dispose(){},onDidChange:Event.None,getPrimaryActions:()=>[],getSecondaryActions:()=>[],getContextMenuActions:()=>[]};
    throw new Error(`Workbench sidebar dependency: ${Ctor.name}`);
  }};
  class Title extends CompositePart<any>{
    minimumWidth=0;maximumWidth=Infinity;minimumHeight=0;maximumHeight=Infinity;
    constructor(){super({error:console.error} as any,new InMemoryStorageService(),menus as any,{registerPart:()=>({dispose(){}})} as any,keys as any,hover as any,instantiation,theme,{} as any,`demo.${id}`,'','sideBar','viewlet','sideBarTitle.foreground','sideBarTitle.border',`demo.${id}`,{hasTitle:true,trailingSeparator:false});this.titleArea=this.createTitleArea(surface);this.titleLabel!.updateTitle(id,config.title);this.titleLabel!.updateStyles();this.toolBar!.setActions([],[new Action('views','Views')]);this.titleArea!.classList.add('has-actions');}
    toJSON(){return {};}
  }
  new Title();
  let input:InputBox|undefined;
  const filterHeight=config.filter ? config.filter.button ? 78 : 42 : 0;
  if(config.filter){
    const field=document.createElement('div');field.className=`workbench-view-input${config.filter.button?' has-button':''}`;surface.append(field);
    input=new InputBox(field,undefined,{placeholder:config.filter.placeholder,ariaLabel:config.filter.label,inputBoxStyles:defaultInputBoxStyles});
    if(config.filter.button){const button=new Button(field,{...defaultButtonStyles});button.label=config.filter.button;button.enabled=false;input.onDidChange(()=>button.enabled=!!input!.value.trim());}
  }
  const body=document.createElement('div');surface.append(body);
  const panes=new PaneView(body);
  class Section extends ViewPane {
    tree!:ObjectTree<TreeNode,void>;
    treeHost!:HTMLElement;
    constructor(readonly definition:WorkbenchSection){super({id:`demo.${id}.${definition.id}`,title:definition.title,expanded:definition.expanded!==false},keys as any,menus as any,settings,contexts,descriptors,instantiation,{} as any,theme,hover as any);this.minimumBodySize=definition.minimumBodySize??120;this.maximumBodySize=definition.maximumBodySize??Infinity;(this as any).menuActions.getPrimaryActions=()=> (definition.actions||[]).map(action=>'separator' in action?null:new Action(action.id,action.label,`codicon-${action.icon}`)).filter(Boolean);}
    protected override renderBody(container:HTMLElement){
      const host=document.createElement('div');host.className='customview-tree';container.append(host);this.treeHost=host;
      this.tree=new ObjectTree<TreeNode,void>(`workbench-${id}-${this.definition.id}`,host,{getHeight:()=>22,getTemplateId:()=> 'node'},[{
        templateId:'node',renderTemplate(container:HTMLElement){container.classList.add('custom-view-tree-node-item');const label=new IconLabel(container),icon=document.createElement('span');label.element.prepend(icon);const actions=document.createElement('div');actions.className='actions';label.element.append(actions);return{label,icon,bar:new ActionBar(actions)};},
        renderElement({element},_index,data){data.label.element.closest<HTMLElement>('.monaco-list-row')!.dataset.id=element.id;data.icon.className=`custom-view-tree-node-item-icon codicon codicon-${element.icon || (element.children?'folder':'file')}`;data.label.setLabel(element.label,element.description,{extraClasses:['custom-view-tree-node-item-resourceLabel']});data.bar.clear();data.bar.setAriaLabel(`Actions for ${element.label}`);data.bar.push((element.actions||[]).map(action=>new Action(action.id,action.label,`codicon-${action.icon}`,!action.disabled)),{icon:true,label:false});},
        disposeTemplate(data){data.label.dispose();data.bar.dispose();},
      }],{indent:8,renderIndentGuides:RenderIndentGuides.Always,multipleSelectionSupport:true,expandOnlyOnTwistieClick:true,horizontalScrolling:false,smoothScrolling:false,keyboardNavigationLabelProvider:{getKeyboardNavigationLabel:node=>node.label},accessibilityProvider:{getAriaLabel:node=>[node.label,node.actions?.length?'has actions':undefined].filter(Boolean).join(', '),getWidgetAriaLabel:()=>`${config.title} ${this.definition.title}`},identityProvider:{getId:node=>node.id}});
      this.tree.style({...defaultListStyles,listBackground:'var(--vscode-sideBar-background)'});this.updateNodes();
    }
    updateNodes(){if(!this.tree)return;const query=id==='extensions'?input?.value.toLowerCase()||'':'';const nodes=this.definition.nodes.filter(node=>!query||`${node.label} ${node.description}`.toLowerCase().includes(query));const toElements=(items:TreeNode[]):any[]=>items.map(element=>({element,collapsed:element.children?!(this.definition.expandedIds||[]).includes(element.id):undefined,children:element.children?toElements([...element.children]):undefined}));this.tree.setChildren(null,toElements(nodes));}
    protected override layoutBody(height:number,width:number){if(this.treeHost)this.treeHost.style.height=`${height}px`;this.tree?.layout(height,width);}
  }
  const sections=config.sections.map(definition=>{const pane=new Section(definition);pane.render();pane.style({headerForeground:'var(--vscode-sideBarSectionHeader-foreground)',headerBackground:'var(--vscode-sideBarSectionHeader-background)',headerBorder:'var(--vscode-sideBarSectionHeader-border)',leftBorder:undefined,dropBackground:undefined});panes.addPane(pane,definition.size);return pane;});
  input?.onDidChange(()=>{if(id==='extensions')sections.forEach(section=>section.updateNodes());});
  function resize(width:number,nextHeight:number){surface.style.height=`${nextHeight}px`;body.style.height=`${Math.max(0,nextHeight-35-filterHeight)}px`;panes.layout(Math.max(0,nextHeight-35-filterHeight),width);}
  resize(surface.parentElement!.clientWidth,height);
  return {resize,focus:()=>{if(input)input.focus();else sections.find(section=>section.isExpanded())?.tree?.domFocus();}};
}
