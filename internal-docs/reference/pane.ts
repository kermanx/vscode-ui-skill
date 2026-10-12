// Independent oracle: real Pane, header composition from ViewPane, and original controls.
import { Pane } from '../../vscode/src/vs/base/browser/ui/splitview/paneview.js';
import { WorkbenchToolBar } from '../../vscode/src/vs/platform/actions/browser/toolbar.js';
import { Action, Separator } from '../../vscode/src/vs/base/common/actions.js';
import { ContextView, ContextViewDOMPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { getIconsStyleSheet } from '../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js';
import { CountBadge } from '../../vscode/src/vs/base/browser/ui/countBadge/countBadge.js';
import { InputBox } from '../../vscode/src/vs/base/browser/ui/inputbox/inputBox.js';
import { Button } from '../../vscode/src/vs/base/browser/ui/button/button.js';
import { ObjectTree } from '../../vscode/src/vs/base/browser/ui/tree/objectTree.js';
import { IconLabel } from '../../vscode/src/vs/base/browser/ui/iconLabel/iconLabel.js';
import { RenderIndentGuides } from '../../vscode/src/vs/base/browser/ui/tree/abstractTree.js';
import { defaultButtonStyles, defaultCountBadgeStyles, defaultInputBoxStyles, defaultListStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import '../../vscode/src/vs/workbench/browser/parts/views/media/paneviewlet.css';
import '../../vscode/src/vs/workbench/contrib/extensions/browser/media/extensionsViewlet.css';
import { paneExamples, paneFiles, paneBodyStyle, type PaneExample } from '../../components/stories/PaneData';
import { actionsForMenu } from './menu';
export function mountPane(root:HTMLElement,surface:HTMLElement,state:any){
  surface.className='specimen';surface.style.cssText='display:flex;flex-direction:column;gap:12px;padding:4px;box-sizing:border-box';
  Object.assign(state,{expansion:[],actions:[],visibility:[],renders:paneExamples.map(()=>0)});
  const icons=getIconsStyleSheet(undefined),iconStyle=document.createElement('style');iconStyle.textContent=icons.getCSS();document.head.append(iconStyle);
  const view=new ContextView(root,ContextViewDOMPosition.FIXED);
  const handler=new ContextMenuHandler({showContextView:delegate=>view.show(delegate),hideContextView:data=>view.hide(data)} as any,{publicLog2(){}} as any,{error:console.error} as any,{lookupKeybinding:()=>undefined} as any);
  class FixturePane extends Pane {
    titleNode!:HTMLElement;descriptionNode?:HTMLElement;iconNode!:HTMLElement;twisty!:HTMLElement;headerNode!:HTMLElement;actionsNode!:HTMLElement;toolbar!:WorkbenchToolBar;badge?:CountBadge;tree?:ObjectTree<any,any>;
    constructor(readonly config:PaneExample,readonly index:number,readonly host:HTMLElement){super({title:config.title,titleDescription:config.description,expanded:config.expanded});}
    protected renderHeader(container:HTMLElement){
      this.headerNode=container;
      this.twisty=document.createElement('div');this.twisty.className=`twisty-container codicon codicon-chevron-${this.isExpanded()?'down':'right'}`;container.append(this.twisty);
      this.iconNode=document.createElement('div');this.iconNode.className='icon codicon codicon-window';this.iconNode.setAttribute('aria-label',`${this.config.title}${this.config.description?' - '+this.config.description:''}`);container.append(this.iconNode);
      this.titleNode=document.createElement('h3');this.titleNode.className='title';this.titleNode.textContent=this.config.title;container.append(this.titleNode);
      if(this.config.description)this.setDescription(this.config.description);
      this.actionsNode=document.createElement('div');this.actionsNode.className='actions';container.append(this.actionsNode);this.updateVisibility();
      this.toolbar=new WorkbenchToolBar(this.actionsNode,{ariaLabel:`${this.config.title} actions`,renderDropdownAsChildElement:true},{} as any,{} as any,handler as any,{lookupKeybinding:()=>undefined} as any,{} as any,{} as any);
      this.setActions();this._register(this.toolbar);this.toolbar.onDidChangeDropdownVisibility(visible=>state.visibility.push(`${this.index}:${visible}`));
      this.actionsNode.addEventListener('click',event=>event.preventDefault());
      if(this.config.count!==undefined){container.classList.add('extension-view-header');const wrapper=document.createElement('div');wrapper.className='count-badge-wrapper';container.append(wrapper);this.badge=this._register(new CountBadge(wrapper,{count:this.config.count},defaultCountBadgeStyles));}
    }
    protected override updateHeader(){super.updateHeader();if(this.twisty)this.twisty.className=`twisty-container codicon codicon-chevron-${this.isExpanded()?'down':'right'}`;}
    setDescription(description?:string){if(!this.descriptionNode&&description){this.descriptionNode=document.createElement('span');this.descriptionNode.className='description';this.titleNode.after(this.descriptionNode);}if(this.descriptionNode)this.descriptionNode.textContent=description??'';}
    updateVisibility(){this.actionsNode.classList.toggle('show-always',this.config.actionsVisibility==='always');this.actionsNode.classList.toggle('show-expanded',this.config.actionsVisibility==='expanded');}
    setActions(){const primary=(this.config.actions??[]).map(entry=>{if('separator'in entry)return new Separator();return new Action(entry.id,entry.label,entry.icon?`codicon-${entry.icon}`:'',!entry.disabled,async()=>{state.actions.push(`${this.index}:${entry.id}`);});});this.toolbar.setActions(primary,actionsForMenu(this.config.secondaryActions??[],id=>state.actions.push(`${this.index}:${id}`)));}
    protected renderBody(container:HTMLElement){
      state.renders[this.index]++;
      if(this.config.body==='files'){
        const treeHost=document.createElement('div');treeHost.className='customview-tree';container.append(treeHost);
        this.tree=this._register(new ObjectTree<any,any>('pane-files',treeHost,{getHeight:()=>22,getTemplateId:()=> 'item'},[{
          templateId:'item',renderTemplate(row){row.classList.add('custom-view-tree-node-item');const label=new IconLabel(row),icon=document.createElement('span');label.element.prepend(icon);return{label,icon};},
          renderElement({element},_index,data){data.label.element.closest<HTMLElement>('.monaco-list-row')!.dataset.id=element.id;data.icon.className=`custom-view-tree-node-item-icon codicon codicon-${element.icon}`;data.label.setLabel(element.label,undefined,{extraClasses:['custom-view-tree-node-item-resourceLabel']});},disposeTemplate(data){data.label.dispose();},
        }],{indent:8,renderIndentGuides:RenderIndentGuides.Always,multipleSelectionSupport:true,expandOnlyOnTwistieClick:true,horizontalScrolling:false,smoothScrolling:false,keyboardNavigationLabelProvider:{getKeyboardNavigationLabel:node=>node.label},accessibilityProvider:{getAriaLabel:node=>node.label,getWidgetAriaLabel:()=> 'Open editor files'},identityProvider:{getId:node=>node.id}}));
        this.tree.setChildren(null,paneFiles.map(element=>({element})));this.tree.style({...defaultListStyles,listBackground:'var(--vscode-sideBar-background)'});
        return;
      }
      const body=document.createElement('div');body.style.cssText=paneBodyStyle;container.append(body);
      if(this.config.body==='input'){const inputHost=document.createElement('div');inputHost.style.width='178px';body.append(inputHost);const input=this._register(new InputBox(inputHost,undefined,{ariaLabel:`Pane input ${this.index}`,placeholder:'Retained input',inputBoxStyles:defaultInputBoxStyles}));}
      else {const label=document.createElement('span');label.textContent='No items to display.';body.append(label);}
      let count=0;const button=this._register(new Button(body,{...defaultButtonStyles}));button.label='Count 0';button.element.style.width='72px';button.onDidClick(()=>button.label=`Count ${++count}`);
    }
    protected layoutBody(height:number,width:number){this.tree?.layout(height,width);}
    relayout(){this.host.style.height=`${(this.headerVisible?22:0)+(this.isExpanded()?this.config.bodyHeight:0)}px`;this.orthogonalSize=340;this.layout((this.headerVisible?22:0)+(this.isExpanded()?this.config.bodyHeight:0));}
    applyStyles(){const prefix=this.config.location==='panel'?'panelSectionHeader':'sideBarSectionHeader';this.style({headerForeground:`var(--vscode-${prefix}-foreground)`,headerBackground:`var(--vscode-${prefix}-background)`,headerBorder:`var(--vscode-${prefix}-border)`,leftBorder:undefined,dropBackground:undefined});this.iconNode.style.color=`var(--vscode-${prefix}-foreground, var(--vscode-foreground))`;const wrapper=this.element.parentElement!;wrapper.style.background=this.config.location==='panel'?'var(--vscode-panel-background)':'var(--vscode-sideBar-background)';wrapper.style.color=this.config.location==='panel'?'var(--vscode-foreground)':'var(--vscode-sideBar-foreground, var(--vscode-foreground))';}
    update(props:Partial<PaneExample>){Object.assign(this.config,props);if(props.collapsible!==undefined)this.collapsible=props.collapsible;if(props.headerVisible!==undefined){this.headerVisible=props.headerVisible;this.element.classList.toggle('merged-header',!props.headerVisible);}if(props.title!==undefined||props.description!==undefined){this.titleNode.textContent=this.config.title;this.setDescription(this.config.description);const label=`${this.config.title}${this.config.description?' - '+this.config.description:''}`;this.iconNode.setAttribute('aria-label',label);this.ariaHeaderLabel=`${label} Section`;}if(props.actionsVisibility!==undefined)this.updateVisibility();if(props.count!==undefined)this.badge?.setCount(props.count);if(props.location!==undefined)this.applyStyles();this.relayout();}
  }
  const panes=paneExamples.map((example,index)=>{
    const host=document.createElement('div');host.dataset.index=String(index);host.style.width='340px';surface.append(host);
    let wrapper=document.createElement('div');wrapper.className='monaco-pane-view';
    if(example.count!==undefined){const extensions=document.createElement('div');extensions.className='extensions-viewlet';host.append(extensions);wrapper.classList.add('extensions');wrapper.style.height='100%';extensions.append(wrapper);}else host.append(wrapper);
    const pane=new FixturePane({...example},index,host);wrapper.append(pane.element);pane.render();pane.collapsible=example.collapsible!==false;pane.headerVisible=example.headerVisible!==false;pane.element.classList.toggle('merged-header',!pane.headerVisible);pane.applyStyles();pane.relayout();
    pane.onDidChangeExpansionState(expanded=>{state.expansion.push(`${index}:${expanded}`);pane.relayout();});
    return pane;
  });
  (window as any).fixturePanes=panes.map(pane=>({focus:()=>pane.draggableElement?.focus(),isExpanded:()=>pane.isExpanded(),setExpanded:(value:boolean)=>pane.setExpanded(value)}));
  (window as any).fixtureUpdatePane=(index:number,props:Partial<PaneExample>)=>panes[index].update(props);
}
