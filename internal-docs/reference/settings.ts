// Independent oracle: original SettingsEditor2 header/body/layout, SettingsTree,
// SettingsTreeSettingElement, every native setting renderer and TOCTree.
// Only persistence, search results and workbench services are fixture hosts.
import { IME } from '../../vscode/src/vs/base/common/ime.js';
import { CommandsRegistry } from '../../vscode/src/vs/platform/commands/common/commands.js';
import { SettingsEditor2 } from '../../vscode/src/vs/workbench/contrib/preferences/browser/settingsEditor2.js';
import { SettingsTree, SettingTreeRenderers } from '../../vscode/src/vs/workbench/contrib/preferences/browser/settingsTree.js';
import { SettingsTreeGroupElement, SettingsTreeSettingElement, parseQuery } from '../../vscode/src/vs/workbench/contrib/preferences/browser/settingsTreeModels.js';
import { TOCTree, TOCTreeModel, createTOCIterator } from '../../vscode/src/vs/workbench/contrib/preferences/browser/tocTree.js';
import { SuggestEnabledInputWithHistory } from '../../vscode/src/vs/workbench/contrib/codeEditor/browser/suggestEnabledInput/suggestEnabledInput.js';
import { StandaloneServices } from '../../vscode/src/vs/editor/standalone/browser/standaloneServices.js';
import { IStandaloneThemeService } from '../../vscode/src/vs/editor/standalone/common/standaloneTheme.js';
import { IConfigurationService, ConfigurationTarget } from '../../vscode/src/vs/platform/configuration/common/configuration.js';
import { IContextViewService } from '../../vscode/src/vs/platform/contextview/browser/contextView.js';
import { IExtensionService } from '../../vscode/src/vs/workbench/services/extensions/common/extensions.js';
import { IExtensionsWorkbenchService } from '../../vscode/src/vs/workbench/contrib/extensions/common/extensions.js';
import { IWorkbenchEnvironmentService } from '../../vscode/src/vs/workbench/services/environment/common/environmentService.js';
import { IProductService } from '../../vscode/src/vs/platform/product/common/productService.js';
import { ILanguageService } from '../../vscode/src/vs/editor/common/languages/language.js';
import { IUserDataProfilesService } from '../../vscode/src/vs/platform/userDataProfile/common/userDataProfile.js';
import { IUserDataSyncEnablementService } from '../../vscode/src/vs/platform/userDataSync/common/userDataSync.js';
import { IMarkdownRendererService } from '../../vscode/src/vs/platform/markdown/browser/markdownRenderer.js';
import { IWorkspaceContextService } from '../../vscode/src/vs/platform/workspace/common/workspace.js';
import { ILabelService } from '../../vscode/src/vs/platform/label/common/label.js';
import { IKeybindingService } from '../../vscode/src/vs/platform/keybinding/common/keybinding.js';
import { IThemeService } from '../../vscode/src/vs/platform/theme/common/themeService.js';
import { IStorageService, InMemoryStorageService } from '../../vscode/src/vs/platform/storage/common/storage.js';
import { IAccessibilityService } from '../../vscode/src/vs/platform/accessibility/common/accessibility.js';
import { Event } from '../../vscode/src/vs/base/common/event.js';
import { Delayer } from '../../vscode/src/vs/base/common/async.js';
import { ActionRunner } from '../../vscode/src/vs/base/common/actions.js';
import { URI } from '../../vscode/src/vs/base/common/uri.js';
import { Dimension } from '../../vscode/src/vs/base/browser/dom.js';
import { notificationServices } from './notification-services';
import { settingsGroups, initialSettingsValues } from '../../components/stories/SettingsData';
import '../../vscode/src/vs/workbench/contrib/preferences/browser/media/settingsEditor2.css';

export function mountSettings(root: HTMLElement, surface: HTMLElement, state: any, options: { width?: number; height?: number } = {}) {
 const params = new URLSearchParams(location.search); let width = options.width ?? Number(params.get('width') || 880), height = options.height ?? Number(params.get('height') || 620);
 Object.assign(state, { query:'', target:'user', category:'', values:structuredClone(initialSettingsValues), changes:[], opens:[], copies:[], links:[], focus:'', allProfiles:[] });
 surface.className='specimen'; surface.style.cssText=`width:${width}px;height:${height}px`;
 const editor=document.createElement('div');editor.className='settings-editor';editor.tabIndex=-1;editor.style.background='var(--vscode-editor-background)';surface.append(editor);
 const services=notificationServices(root,state), {collection,instantiation}=services;
 const definitions = new Map(settingsGroups.flatMap(group=>group.settings.map(setting=>[setting.key,setting] as const)));
 const originalGet=services.config.getValue;
 (collection.get(IKeybindingService) as any).appendKeybinding=(label:string)=>label;
 Object.assign(services.config, {
  getValue:(key:string)=>key==='settingsSync.ignoredSettings'?[]:key==='workbench.settings.applyToAllProfiles'?state.allProfiles:key==='workbench.settings.settingsSearchTocBehavior'?'filter':originalGet(key),
  inspect:(key:string)=>({key,defaultValue:definitions.get(key)?.defaultValue,userLocalValue:state.values.user[key],workspaceValue:state.values.workspace[key],userLocal:{value:state.values.user[key]},value:state.values[state.target][key]??definitions.get(key)?.defaultValue}),
  isSettingAppliedForAllProfiles:(key:string)=>state.allProfiles.includes(key),
  updateValue:(key:string,value:unknown)=>{if(key==='workbench.settings.applyToAllProfiles'){state.allProfiles=value||[];services.configurationChanged.fire({affectedKeys:new Set([key]),affectsConfiguration:(id:string)=>id===key});}return Promise.resolve();},
 });
 const language:any={isRegisteredLanguageId:()=>false,getLanguageName:(id:string)=>id,getRegisteredLanguageIds:()=>[],onDidChange:Event.None};
 const product:any={urlProtocol:'vscode',nameLong:'Visual Studio Code'};
 const profile:any={currentProfile:{isDefault:true}};
 const sync:any={isEnabled:()=>false,canToggleEnablement:()=>false,onDidChangeEnablement:Event.None};
 collection.set(IContextViewService,{showContextView:(delegate:any)=>services.view.show(delegate),hideContextView:()=>services.view.hide(),layout:()=>services.view.layout()} as any);
 collection.set(IExtensionService,{onDidChangeExtensions:Event.None,extensions:[]} as any);
 collection.set(IExtensionsWorkbenchService,{} as any);
 collection.set(IWorkbenchEnvironmentService,{remoteAuthority:undefined} as any);
 collection.set(IProductService,product);collection.set(ILanguageService,language);
 collection.set(IUserDataProfilesService,{profiles:[],defaultProfile:{name:'Default'}} as any);
 collection.set(IUserDataSyncEnablementService,sync);
 collection.set(IMarkdownRendererService,{} as any); // Fixtures use plain descriptions.
 collection.set(IWorkspaceContextService,{getWorkbenchState:()=>2,getWorkspace:()=>({folders:[{uri:URI.file('/workspace'),name:'Workspace',index:0}]}),onDidChangeWorkbenchState:Event.None,onDidChangeWorkspaceFolders:Event.None} as any);
 collection.set(ILabelService,{getHostLabel:()=>'',getWorkspaceLabel:()=> 'Workspace'} as any);
 collection.set(IStorageService,new InMemoryStorageService());
 collection.set(IAccessibilityService,{isScreenReaderOptimized:()=>false,onDidChangeScreenReaderOptimized:Event.None} as any);
 const standalone=StandaloneServices.initialize({});
 const standaloneTheme=StandaloneServices.get(IStandaloneThemeService);
 const colors:Record<string,string>={};const computed=getComputedStyle(root);
 for(let i=0;i<computed.length;i++){const name=computed.item(i);if(name.startsWith('--vscode-')){const value=computed.getPropertyValue(name).trim();if(value.startsWith('#'))colors[name.slice(9).replaceAll('-','.')]=value;}}
 const themeName=params.get('theme')||'dark';standaloneTheme.defineTheme('settings-fixture',{base:themeName==='light'?'vs':themeName==='hcLight'?'hc-light':themeName==='hcBlack'?'hc-black':'vs-dark',inherit:true,rules:[],colors});standaloneTheme.setTheme('settings-fixture');
 const viewState:any={settingsTarget:ConfigurationTarget.USER_LOCAL};

 let groups:SettingsTreeGroupElement[]=[];let models:SettingsTreeSettingElement[]=[];
 const host:any={viewState,rootElement:editor,configurationService:services.config,theme:(collection.get(IThemeService) as any).getColorTheme(),_register:(value:any)=>value,isVisible:()=>true,
  storageService:{getNumber:(_key:string,_scope:number,fallback:number)=>fallback,store(){}},
  instantiationService:{createInstance:(Ctor:any,...args:any[])=>Ctor===SuggestEnabledInputWithHistory?standalone.createInstance(Ctor,...args):instantiation.createInstance(Ctor,...args)},
  languageService:language,installedExtensionIds:[],loadSearchHistory:()=>[],updateSearchPlaceholder(){},searchInputDelayer:new Delayer(200),
  onSearchInputChanged:()=>{state.query=host.searchWidget.getValue();state.category='';viewState.categoryFilter=undefined;host.settingsTree.scrollTop=0;update();},clearSearchResults:()=>{host.searchWidget.setValue('');},clearSearchFilters:()=>(SettingsEditor2.prototype as any).clearSearchFilters.call(host),
  onDidSettingsTargetChange:(target:number)=>{viewState.settingsTarget=target;state.target=target===ConfigurationTarget.WORKSPACE?'workspace':'user';rebuild();},
  applyFilter:(filter:string)=>(SettingsEditor2.prototype as any).applyFilter.call(host,filter),removeLanguageFilters:()=>(SettingsEditor2.prototype as any).removeLanguageFilters.call(host),focusSearch:(query:string)=>{host.searchWidget.setValue(query);host.searchWidget.focus();},
  focusSettings:()=>host.settingsTree.domFocus(),userDataSyncWorkbenchService:{enabled:false},userDataSyncEnablementService:sync,actionRunner:new ActionRunner(),
  disableAiSearchToggle(){},updateAiSearchToggleVisibility(){},onDidToggleAiSearch(){},
  createTOC:(container:HTMLElement)=>(SettingsEditor2.prototype as any).createTOC.call(host,container),
  createSettingsTree:(container:HTMLElement)=>(SettingsEditor2.prototype as any).createSettingsTree.call(host,container),
  settingRowFocused:{set(){}},settingFirstRowFocused:{set(){}},tocRowFocused:{set(){}},updateSettingFirstRowFocusedContext(){},updateTreeScrollSync(){},
  renderTree:()=>{state.category=viewState.categoryFilter?.id||'';update();},onDidChangeSetting:(key:string,value:unknown,_type:string,manualReset:boolean)=>handleChange(key,value,manualReset),
  openSettingsFile:(options:any)=>state.opens.push(options.revealSetting.key),
  layoutSplitView:(dimension:Dimension)=>(SettingsEditor2.prototype as any).layoutSplitView.call(host,dimension),
 };
 (SettingsEditor2.prototype as any).createHeader.call(host,editor);
 (SettingsEditor2.prototype as any).createBody.call(host,editor);
 const renderers=host.settingRenderers;
 // Workbench trees disable their base keyboard controller and use registered list commands.
 // Supply only the missing keybinding dispatch, retaining the genuine command handlers.
 for(const tree of [host.settingsTree,host.tocTree])tree.getHTMLElement().addEventListener('keydown',(event:KeyboardEvent)=>{if(event.target!==tree.getHTMLElement())return;const command:Record<string,string>={ArrowDown:'list.focusDown',ArrowUp:'list.focusUp',Home:'list.focusFirst',End:'list.focusLast',PageDown:'list.focusPageDown',PageUp:'list.focusPageUp',Enter:'list.select'};const entry=CommandsRegistry.getCommand(command[event.key]);if(entry){instantiation.invokeFunction((accessor:any)=>entry.handler(accessor));event.preventDefault();}});

 function layout(){SettingsEditor2.prototype.layout.call(host,new Dimension(width,height));}
 function rebuild(){models=[];groups=settingsGroups.map((group,index)=>{const nativeGroup=new SettingsTreeGroupElement(group.id,undefined,group.label,0,index===0);nativeGroup.children=group.settings.map(setting=>{const nativeSetting:any={...setting,type:setting.type==='enum'||setting.type==='multiline'?'string':setting.type==='complex'?'array':setting.type,description:[setting.description],enum:setting.options?.map(option=>option.value),enumDescriptions:setting.options?.map(option=>option.description||''),editPresentation:setting.type==='multiline'?'multilineText':undefined,scope:5,range:{startLineNumber:1,startColumn:1,endLineNumber:1,endColumn:1}};const model=new SettingsTreeSettingElement(nativeSetting,nativeGroup,viewState.settingsTarget,true,undefined,language,product,profile,services.config as any,false,{hasAssignment:()=>false} as any,{getValue:()=>undefined} as any);model.inspectSelf();model.tabbable=true;models.push(model);return model;});return nativeGroup;});update();}
 function update(){const parsed=parseQuery(state.query);viewState.tagFilters=new Set(parsed.tags);viewState.idFilters=new Set(parsed.idFilters);viewState.categoryFilter=groups.find(group=>group.id===state.category);const query=parsed.query.toLowerCase();const matched=models.filter(model=>{model.inspectSelf();return model.matchesAllTags(viewState.tagFilters)&&model.matchesAnyId(viewState.idFilters)&&(!query||`${model.setting.key} ${model.description} ${model.displayLabel}`.toLowerCase().includes(query));});
  const rootModel=new SettingsTreeGroupElement('root',undefined,'',0,false);rootModel.children=groups;
  const tocModel=instantiation.createInstance(TOCTreeModel,viewState);tocModel.settingsTreeRoot=rootModel;
  groups.forEach(group=>group.count=matched.filter(model=>model.parent===group).length);
  host.settingsTree.setChildren(null,groups.map(element=>({element,collapsed:false,children:matched.filter(model=>model.parent===element).map(element=>({element}))})));
  host.tocTree.setChildren(null,createTOCIterator(tocModel,host.tocTree));host.settingsTree.refilter();host.tocTree.refilter();
  const visible=matched.filter(model=>!state.category||model.parent?.id===state.category).length;host.countElement.textContent=state.query?`${visible} Settings Found`:'';editor.classList.toggle('no-results',visible===0);editor.classList.toggle('search-mode',!!state.query);host.clearFilterLinkContainer.style.display=parsed.tags.length||parsed.idFilters.length?'':'none';state.visible=matched.filter(model=>!state.category||model.parent?.id===state.category).map(model=>model.setting.key);layout();
 }
 function handleChange(key:string,value:unknown,manualReset:boolean){state.changes.push({key,value:value??null,target:state.target,manualReset});if(value===undefined)delete state.values[state.target][key];else state.values[state.target][key]=value;models.forEach(model=>model.inspectSelf());const row=editor.querySelector(`[data-key="${CSS.escape(key)}"]`);row?.classList.toggle('is-configured',value!==undefined);if(manualReset)host.settingsTree.rerender();}
 renderers.onDidFocusSetting((model:any)=>state.focus=model.setting.key);
 (window as any).fixtureApi={setSearchImeEnabled:(enabled:boolean)=>enabled?IME.enable():IME.disable(),resize:(nextWidth:number,nextHeight:number)=>{width=nextWidth;height=nextHeight;surface.style.width=`${width}px`;surface.style.height=`${height}px`;layout();},focus:()=>host.searchWidget.focus(),query:(value:string)=>host.searchWidget.setValue(value),reveal:(key:string)=>host.settingsTree.reveal(models.find(model=>model.setting.key===key)),resetCategory:()=>{state.category='';update();}};
 rebuild();
}
