// Independent oracle: real MarkersTree, all three original renderers, Filter and FilterWidget.
import {
  MarkersTree,
  MarkersView,
} from "../../vscode/src/vs/workbench/contrib/markers/browser/markersView.js";
import {
  Marker,
  RelatedInformation,
  ResourceMarkers,
} from "../../vscode/src/vs/workbench/contrib/markers/browser/markersModel.js";
import {
  Filter,
  MarkerRenderer,
  RelatedInformationRenderer,
  ResourceMarkersRenderer,
  VirtualDelegate,
  MarkersWidgetAccessibilityProvider,
} from "../../vscode/src/vs/workbench/contrib/markers/browser/markersTreeViewer.js";
import { FilterOptions } from "../../vscode/src/vs/workbench/contrib/markers/browser/markersFilterOptions.js";
import { QuickFixAction } from "../../vscode/src/vs/workbench/contrib/markers/browser/markersViewActions.js";
import {
  FilterWidget,
  viewFilterSubmenu,
} from "../../vscode/src/vs/workbench/browser/parts/views/viewFilter.js";
import { ResourceLabels } from "../../vscode/src/vs/workbench/browser/labels.js";
import { DecorationsService } from "../../vscode/src/vs/workbench/services/decorations/browser/decorationsService.js";
import {
  IMenuService,
  MenuRegistry,
} from "../../vscode/src/vs/platform/actions/common/actions.js";
import { MenuService } from "../../vscode/src/vs/platform/actions/common/menuService.js";
import { IActionViewItemService } from "../../vscode/src/vs/platform/actions/browser/actionViewItemService.js";
import {
  IStorageService,
  InMemoryStorageService,
} from "../../vscode/src/vs/platform/storage/common/storage.js";
import { IAccessibilityService } from "../../vscode/src/vs/platform/accessibility/common/accessibility.js";
import { IContextViewService } from "../../vscode/src/vs/platform/contextview/browser/contextView.js";
import { IKeybindingService } from "../../vscode/src/vs/platform/keybinding/common/keybinding.js";
import { IThemeService } from "../../vscode/src/vs/platform/theme/common/themeService.js";
import { IHoverService } from "../../vscode/src/vs/platform/hover/browser/hover.js";
import { IOpenerService } from "../../vscode/src/vs/platform/opener/common/opener.js";
import { ContextKeyExpr } from "../../vscode/src/vs/platform/contextkey/common/contextkey.js";
import { CommandsRegistry } from "../../vscode/src/vs/platform/commands/common/commands.js";
import { Action } from "../../vscode/src/vs/base/common/actions.js";
import { Event, Relay } from "../../vscode/src/vs/base/common/event.js";
import { URI } from "../../vscode/src/vs/base/common/uri.js";
import { extUri } from "../../vscode/src/vs/base/common/resources.js";
import { defaultListStyles } from "../../vscode/src/vs/platform/theme/browser/defaultStyles.js";
import { notificationServices } from "./notification-services";
import {
  manyProblems,
  problemItems,
} from "../../components/stories/ProblemsData";
import "../../vscode/src/vs/workbench/contrib/markers/browser/media/markers.css";
import "../../vscode/src/vs/workbench/browser/parts/views/media/views.css";
import "../../vscode/src/vs/workbench/browser/media/style.css";

export function mountProblems(
  root: HTMLElement,
  surface: HTMLElement,
  state: any
) {
  for (const key of Object.keys(state)) delete state[key];
  const params = new URLSearchParams(location.search);
  let width = Number(params.get("width") || 720), height = 320;
  const items = structuredClone(
    params.has("empty")
      ? []
      : params.has("large")
      ? manyProblems()
      : problemItems
  );
  Object.assign(state, {
    filter: "",
    severities: ["error", "info", "warning"],
    expanded: [],
    selected: [],
    collapsed: [],
    focus: [],
    opens: [],
    actions: [],
    links: [],
  });
  surface.className = "specimen";
  surface.style.cssText = `width:${width}px`;
  const panel = document.createElement("div");
  panel.className = "markers-panel pane-body";
  panel.style.cssText =
    "height:320px;overflow:hidden;background:var(--vscode-panel-background);color:var(--vscode-foreground)";
  surface.append(panel);
  const filterHost = document.createElement("div");
  filterHost.className = "viewpane-filter-container";
  panel.append(filterHost);
  const body = document.createElement("div");
  body.className = "markers-panel-container";
  panel.append(body);
  const message = document.createElement("div");
  message.className = "message-box-container";
  body.append(message);
  const treeHost = document.createElement("div");
  treeHost.className = "tree-container show-file-icons";
  body.append(treeHost);
  const services = notificationServices(root, state),
    { collection, instantiation } = services;
  const keybindings: any = collection.get(IKeybindingService);
  keybindings.lookupKeybinding = (id: string) =>
    id === "history.showPrevious" || id === "history.showNext"
      ? {
          getElectronAccelerator: () =>
            id === "history.showPrevious" ? "Up" : "Down",
          getLabel: () => (id === "history.showPrevious" ? "↑" : "↓"),
        }
      : undefined;
  const originalGet = services.config.getValue;
  services.config.getValue = ((key: string) =>
    key === "workbench.tree.indent"
      ? 8
      : key === "workbench.tree.renderIndentGuides"
      ? "onHover"
      : key === "workbench.list.multiSelectModifier"
      ? "ctrlCmd"
      : originalGet(key)) as any;
  collection.set(IContextViewService, {
    showContextView: (delegate: any) => services.view.show(delegate),
    hideContextView: (data: any) => services.view.hide(data),
  } as any);
  collection.set(IAccessibilityService, {
    isScreenReaderOptimized: () => false,
    onDidChangeScreenReaderOptimized: Event.None,
  } as any);
  collection.set(IStorageService, new InMemoryStorageService());
  collection.set(IActionViewItemService, {
    lookUp: () => undefined,
    onDidChange: Event.None,
  } as any);
  collection.set(IMenuService, instantiation.createInstance(MenuService));
  const theme: any = collection.get(IThemeService);
  theme.getFileIconTheme = () => ({
    hasFileIcons: false,
    hasFolderIcons: false,
    hidesExplorerArrows: false,
  });
  theme.onDidFileIconThemeChange = Event.None;
  const languages: any = {
    onDidChange: Event.None,
    guessLanguageIdByFilepathOrFirstLine: () => null,
  };
  const models: any = {
    getModel: () => null,
    onModelLanguageChanged: Event.None,
    onModelAdded: Event.None,
  };
  const workspace: any = {
    onDidChangeWorkspaceFolders: Event.None,
    getWorkbenchState: () => 1,
    getWorkspaceFolder: () => undefined,
    getWorkspace: () => ({ folders: [] }),
  };
  const labelService: any = {
    onDidChangeFormatters: Event.None,
    getUriLabel: (uri: URI) => uri.path,
    getSeparator: () => "/",
  };
  const textFiles: any = {
    untitled: { onDidChangeLabel: Event.None, get: () => undefined },
  };
  const decorations = new DecorationsService({ extUri } as any, theme);
  const labelInstantiation: any = {
    createInstance: (Ctor: any, ...args: any[]) =>
      new Ctor(
        ...args,
        languages,
        models,
        decorations,
        labelService,
        textFiles,
        workspace,
        { getNotebook: () => undefined }
      ),
  };
  const labels = new ResourceLabels(
    { onDidChangeVisibility: Event.None },
    labelInstantiation,
    services.config as any,
    models,
    workspace,
    languages,
    decorations,
    theme,
    labelService,
    textFiles
  );
  const severities = ["error", "warning", "info"];
  const keys = severities.map((severity) =>
    services.context.createKey(`fixture.problems.${severity}`, true)
  );
  severities.forEach((severity, index) => {
    const id = `fixture.problems.toggle.${severity}`;
    MenuRegistry.appendMenuItem(viewFilterSubmenu, {
      command: {
        id,
        title: `Show ${
          severity === "error"
            ? "Errors"
            : severity === "warning"
            ? "Warnings"
            : "Infos"
        }`,
        toggled: ContextKeyExpr.has(`fixture.problems.${severity}`),
      },
      group: "navigation",
      order: index,
    });
    CommandsRegistry.registerCommand(id, () => {
      keys[index].set(!keys[index].get());
      state.severities = severities.filter((_, i) => keys[i].get()).sort();
      updateFilter();
    });
  });
  const filterWidget = instantiation.createInstance(FilterWidget, {
    ariaLabel: "Filter Problems",
    placeholder: "Filter (e.g. text, **/*.ts, !**/node_modules/**, @source:ts)",
  });
  filterHost.append(filterWidget.element);
  filterWidget.layout(width);
  const groups = new Map<string, ResourceMarkers>(),
    byId = new Map<string, any>();
  const viewStates = new Map<string, any>();
  let tree: any;
  for (const item of items) {
    const resource = URI.file(item.resource),
      raw = {
        resource,
        owner: "fixture",
        severity: { error: 8, warning: 4, info: 2 }[item.severity],
        message: item.message,
        startLineNumber: item.line,
        startColumn: item.column,
        endLineNumber: item.endLine || item.line,
        endColumn: item.endColumn || item.column,
        source: item.source,
        code:
          typeof item.code === "object"
            ? { value: item.code.value, target: URI.parse(item.code.target) }
            : item.code,
      };
    const marker = new Marker(
      item.id,
      raw as any,
      (item.relatedInformation || []).map(
        (info) =>
          new RelatedInformation(info.id, raw as any, {
            resource: URI.file(info.resource),
            message: info.message,
            startLineNumber: info.line,
            startColumn: info.column,
            endLineNumber: info.endLine || info.line,
            endColumn: info.endColumn || info.column,
          })
      )
    );
    byId.set(item.id, marker);
    marker.relatedInformation.forEach((info) => byId.set(info.id, info));
    let group = groups.get(item.resource);
    if (!group) {
      group = new ResourceMarkers(`resource:${item.resource}`, resource);
      groups.set(item.resource, group);
      byId.set(group.id, group);
    }
    group.set(resource, [...group.markers, marker]);
    const quickFixAction = new QuickFixAction(marker);
    quickFixAction.quickFixes = (item.quickFixes || []).map(
      (fix) =>
        new Action(fix.id, fix.label, undefined, !fix.disabled, async () => {
          state.actions.push({ id: fix.id, problem: item.id });
        })
    );
    let multiline = true;
    viewStates.set(item.id, {
      quickFixAction,
      get multiline() {
        return multiline;
      },
      set multiline(value: boolean) {
        multiline = value;
        state.collapsed = [...viewStates]
          .filter(([, value]) => !value.multiline)
          .map(([id]) => id)
          .sort();
        tree.updateElementHeight(marker, value ? marker.lines.length * 22 : 22);
        tree.rerender(marker);
      },
    });
  }
  const viewModel: any = {
    getViewModel: (marker: Marker) => viewStates.get(marker.id),
    onMarkerMouseHover() {},
    onMarkerMouseLeave() {},
  };
  const filter = new Filter(
    new FilterOptions("", [], true, true, true, { extUri } as any)
  );
  const nodeCounts = new Relay<any>();
  tree = instantiation.createInstance(
    MarkersTree,
    "MarkersView",
    treeHost,
    new VirtualDelegate(viewModel),
    [
      new ResourceMarkersRenderer(labels, nodeCounts.event),
      new MarkerRenderer(
        viewModel,
        collection.get(IHoverService) as any,
        instantiation,
        collection.get(IOpenerService) as any
      ),
      new RelatedInformationRenderer(labelService),
    ],
    {
      filter,
      accessibilityProvider: new MarkersWidgetAccessibilityProvider(
        labelService
      ),
      identityProvider: { getId: (element: any) => element.id },
      expandOnlyOnTwistieClick: (element: any) =>
        element instanceof Marker && element.relatedInformation.length > 0,
      overrideStyles: { listBackground: "var(--vscode-panel-background)" },
      selectionNavigation: true,
      multipleSelectionSupport: true,
      horizontalScrolling: false,
    }
  );
  nodeCounts.input = tree.onDidChangeRenderNodeCount;
  const ordered = [...groups.values()].sort(
    (a, b) =>
      b.markers[0].marker.severity - a.markers[0].marker.severity ||
      a.path.localeCompare(b.path)
  );
  tree.setChildren(
    null,
    ordered.map((element) => ({
      element,
      collapsed: false,
      children: element.markers.map((marker) => ({
        element: marker,
        collapsed: marker.relatedInformation.length ? true : undefined,
        children: marker.relatedInformation.map((element) => ({ element })),
      })),
    }))
  );
  tree.style({
    ...defaultListStyles,
    listBackground: "var(--vscode-panel-background)",
  });
  function layout() {
    filterWidget.layout(width);
    tree.layout(Math.max(0, height - filterHost.offsetHeight - 20), width);
  }
  function sync() {
    state.expanded = [...byId.values()]
      .filter(
        (item) =>
          tree.hasElement(item) &&
          tree.isCollapsible(item) &&
          !tree.isCollapsed(item)
      )
      .map((item) => item.id)
      .sort();
    state.selected = tree.getSelection().map((item: any) => item.id);
    state.focus = tree.getFocus().map((item: any) => item.id);
  }
  tree.onDidChangeCollapseState(sync);
  tree.onDidChangeFocus(sync);
  tree.onDidChangeSelection(sync);
  tree.onDidOpen((event: any) => {
    const item = event.element;
    if (item instanceof ResourceMarkers) return;
    const location =
      item instanceof RelatedInformation ? item.raw : item.marker;
    state.opens.push({
      id: item.id,
      resource: location.resource.path,
      line: location.startLineNumber,
      column: location.startColumn,
      preserveFocus: event.editorOptions?.preserveFocus || false,
      pinned: event.editorOptions?.pinned || false,
      sideBySide: event.sideBySide || false,
    });
  });
  const host: any = {
    clearFilters: () => {
      keys.forEach((key) => key.set(true));
      state.severities = severities.slice().sort();
      filterWidget.setFilterText("");
      state.filter = "";
      updateFilter();
    },
    setAriaLabel() {},
  };
  function updateFilter() {
    state.filter = filterWidget.getFilterText();
    filter.options = new FilterOptions(
      state.filter,
      [],
      keys[1].get()!,
      keys[0].get()!,
      keys[2].get()!,
      { extUri } as any
    );
    tree.refilter();
    const filtered = tree.getVisibleItemCount();
    filterWidget.updateBadge(
      items.length && filtered !== items.length
        ? `Showing ${filtered} of ${items.length}`
        : undefined
    );
    filterWidget.checkMoreFilters(state.severities.length < 3);
    message.replaceChildren();
    message.style.display = filtered ? "none" : "block";
    treeHost.classList.toggle("hidden", !filtered);
    if (!filtered) {
      message.tabIndex = 0;
      if (items.length)
        (MarkersView.prototype as any).renderFilteredByFilterMessage.call(
          host,
          message
        );
      else
        (MarkersView.prototype as any).renderNoProblemsMessage.call(
          host,
          message
        );
    }
    layout();
    sync();
  }
  treeHost.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.target !== tree.getHTMLElement()) return;
    const command: Record<string, string> = {
      ArrowDown: "list.focusDown",
      ArrowUp: "list.focusUp",
      Home: "list.focusFirst",
      End: "list.focusLast",
      PageDown: "list.focusPageDown",
      PageUp: "list.focusPageUp",
      ArrowLeft: "list.collapse",
      ArrowRight: "list.expand",
      Enter: "list.select",
      " ": "list.toggleExpand",
      Escape: "list.clear",
    };
    const id =
      (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a"
        ? "list.selectAll"
        : command[event.key];
    if (id) {
      const entry = CommandsRegistry.getCommand(id);
      if (entry) {
        instantiation.invokeFunction((accessor) => entry.handler(accessor));
        event.preventDefault();
      }
    }
  });
  filterWidget.onDidChangeFilterText(updateFilter);
  filterWidget.onDidAcceptFilterText(() => tree.domFocus());
  filterWidget.element.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown")
      instantiation.invokeFunction((accessor) =>
        CommandsRegistry.getCommand(
          event.key === "ArrowUp" ? "history.showPrevious" : "history.showNext"
        )?.handler(accessor)
      );
  });
  (window as any).fixtureApi = {
    resize: (nextWidth: number, nextHeight: number) => {
      width = nextWidth;
      height = nextHeight;
      surface.style.width = `${width}px`;
      panel.style.height = `${height}px`;
      layout();
    },
    focus: () => tree.domFocus(),
    collapseAll: () => tree.collapseMarkers(),
    reveal: (id: string) => tree.reveal(byId.get(id)),
  };
  updateFilter();
  layout();
  sync();
}
