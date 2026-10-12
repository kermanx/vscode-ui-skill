// Independent oracle: instantiate the actual CompositePart title implementation.
import { CompositePart } from '../../vscode/src/vs/workbench/browser/parts/compositePart.js';
import { WorkbenchToolBar } from '../../vscode/src/vs/platform/actions/browser/toolbar.js';
import { InMemoryStorageService } from '../../vscode/src/vs/platform/storage/common/storage.js';
import { ContextView, ContextViewDOMPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { getBaseLayerHoverDelegate } from '../../vscode/src/vs/base/browser/ui/hover/hoverDelegate2.js';
import { Color } from '../../vscode/src/vs/base/common/color.js';
import { Event } from '../../vscode/src/vs/base/common/event.js';
import { Action, Separator } from '../../vscode/src/vs/base/common/actions.js';
import { getIconsStyleSheet } from '../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js';
import '../../vscode/src/vs/workbench/browser/parts/sidebar/media/sidebarpart.css';
import { sidebarTitleExamples, sidebarTitlePrimary, sidebarTitleSecondary } from '../../components/stories/SidebarTitleData';
import { actionsForMenu } from './menu';

export function mountSidebarTitle(root: HTMLElement, surface: HTMLElement, state: any) {
  state.actions = [];
  state.visibility = [];
  surface.className = 'specimen';
  surface.style.cssText = 'display:flex;flex-direction:column;gap:14px';
  const style = document.createElement('style');
  style.textContent = getIconsStyleSheet(undefined).getCSS();
  document.head.append(style);
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  window.addEventListener('resize', () => view.layout());
  const keybindings = { lookupKeybinding: () => undefined };
  const notification = { error: console.error };
  const menus = new ContextMenuHandler({ showContextView: delegate => view.show(delegate), hideContextView: data => view.hide(data) } as any,
    { publicLog2() {} } as any, notification as any, keybindings as any);
  const storage = new InMemoryStorageService();
  const theme = {
    getColorTheme: () => ({
      getColor: (id: string) => Color.Format.CSS.parse(getComputedStyle(root).getPropertyValue(`--vscode-${id.replaceAll('.', '-')}`).trim()) || undefined,
    }),
    onDidColorThemeChange: Event.None,
  };
  const instantiation = {
    createInstance: (ctor: any, ...args: any[]) => {
      if (ctor !== WorkbenchToolBar) throw new Error(`Unexpected fixture dependency: ${ctor.name}`);
      return new WorkbenchToolBar(args[0], args[1], {} as any, {} as any, menus as any, keybindings as any, {} as any, { publicLog2() {} } as any);
    },
  };
  class TitlePart extends CompositePart<any> {
    minimumWidth = 0;
    maximumWidth = Infinity;
    minimumHeight = 0;
    maximumHeight = Infinity;
    constructor(private host: HTMLElement, private caseId: string) {
      super(notification as any, storage, menus as any, { registerPart: () => ({ dispose() {} }) } as any,
        keybindings as any, getBaseLayerHoverDelegate() as any, instantiation as any, theme as any,
        {} as any, 'fixture.sidebar', '', 'sideBar', 'viewlet', 'sideBarTitle.foreground', 'sideBarTitle.border',
        `fixture.sidebar.${caseId}`, { hasTitle: true, trailingSeparator: false });
      this.titleArea = this.createTitleArea(host);
      this.toolBar!.onDidChangeDropdownVisibility(visible => state.visibility.push(`${caseId}:${visible}`));
    }
    update(title: string, primary: readonly any[], secondary: readonly any[], keybinding?: string) {
      this.titleLabel!.updateTitle(this.caseId, title, keybinding);
      this.titleLabel!.updateStyles();
      const actions = primary.map(entry => {
        if ('separator' in entry) return new Separator();
        const action = new Action(entry.id, entry.label, entry.icon ? `codicon-${entry.icon}` : '', !entry.disabled, async () => state.actions.push(`${this.caseId}:${entry.id}`));
        if (entry.checked !== undefined) action.checked = entry.checked;
        return action;
      });
      this.toolBar!.setActions(actions, actionsForMenu(secondary, id => state.actions.push(`${this.caseId}:${id}`)));
      this.titleArea!.classList.toggle('has-actions', primary.length > 0 || secondary.length > 0);
    }
    focusActions() { this.toolBar!.focus(); }
    toJSON() { return {}; }
  }
  const parts = sidebarTitleExamples.map(item => {
    const wrapper = document.createElement('section');
    wrapper.dataset.case = item.id;
    const host = document.createElement('div');
    host.className = 'part sidebar';
    host.style.cssText = 'background-color:var(--vscode-sideBar-background);color:var(--vscode-sideBar-foreground)';
    wrapper.append(host);
    surface.append(wrapper);
    const part = new TitlePart(host, item.id);
    part.update(item.title, item.primary, item.secondary, item.keybinding);
    return part;
  });
  Object.assign(window, {
    fixtureUpdateSidebarTitle: (title: string, actions: boolean) => parts[5].update(title, actions ? sidebarTitlePrimary : [], actions ? sidebarTitleSecondary : []),
    fixtureFocusSidebarTitle: (index: number) => parts[index].focusActions(),
  });
}
