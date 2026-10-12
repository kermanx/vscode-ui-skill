import { PaneView } from '../../vscode/src/vs/base/browser/ui/splitview/paneview.js';
// Independent oracle: actual file/open-editor renderers, resource labels, ViewPane and CompositePart.
import { ObjectTree } from '../../vscode/src/vs/base/browser/ui/tree/objectTree.js';
import {
  ListResourceNavigator,
  TreeResourceNavigator,
} from '../../vscode/src/vs/platform/list/browser/listService.js';
import { List } from '../../vscode/src/vs/base/browser/ui/list/listWidget.js';
import { RenderIndentGuides } from '../../vscode/src/vs/base/browser/ui/tree/abstractTree.js';
import {
  FilesRenderer,
  ExplorerDelegate,
  FileSorter,
} from '../../vscode/src/vs/workbench/contrib/files/browser/views/explorerViewer.js';
// The fixture build appends exports for these existing private classes, without changing their bodies.
import {
  OpenEditorsDelegate,
  EditorGroupRenderer,
  OpenEditorRenderer,
  OpenEditorsView,
} from '../../vscode/src/vs/workbench/contrib/files/browser/views/openEditorsView.js';
import { ExplorerItem } from '../../vscode/src/vs/workbench/contrib/files/common/explorerModel.js';
import { OpenEditor } from '../../vscode/src/vs/workbench/contrib/files/common/files.js';
import { EditorInput } from '../../vscode/src/vs/workbench/common/editor/editorInput.js';
import { ResourceLabels } from '../../vscode/src/vs/workbench/browser/labels.js';
import { DecorationsService } from '../../vscode/src/vs/workbench/services/decorations/browser/decorationsService.js';
import { ViewPane } from '../../vscode/src/vs/workbench/browser/parts/views/viewPane.js';
import { CompositePart } from '../../vscode/src/vs/workbench/browser/parts/compositePart.js';
import { WorkbenchToolBar } from '../../vscode/src/vs/platform/actions/browser/toolbar.js';
import { InMemoryStorageService } from '../../vscode/src/vs/platform/storage/common/storage.js';
import { defaultListStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { getIconsStyleSheet } from '../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js';
import { getBaseLayerHoverDelegate } from '../../vscode/src/vs/base/browser/ui/hover/hoverDelegate2.js';
import {
  ContextView,
  ContextViewDOMPosition,
} from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { URI } from '../../vscode/src/vs/base/common/uri.js';
import { extUri } from '../../vscode/src/vs/base/common/resources.js';
import { Event } from '../../vscode/src/vs/base/common/event.js';
import { Action } from '../../vscode/src/vs/base/common/actions.js';
import { Color } from '../../vscode/src/vs/base/common/color.js';
import { DisposableStore } from '../../vscode/src/vs/base/common/lifecycle.js';
import '../../vscode/src/vs/workbench/contrib/files/browser/media/explorerviewlet.css';
import '../../vscode/src/vs/workbench/contrib/files/browser/views/media/openeditors.css';
import '../../vscode/src/vs/workbench/browser/parts/views/media/views.css';
import '../../vscode/src/vs/workbench/browser/parts/views/media/paneviewlet.css';
import '../../vscode/src/vs/workbench/browser/parts/sidebar/media/sidebarpart.css';
import './explorer-assets/seti.css';
import { explorerExamples } from '../../components/stories/ExplorerData';
import type { ExplorerExample } from '../../components/stories/ExplorerData';
import { actionsForMenu } from './menu';

export function mountExplorer(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
  options: { width?: number; height?: number; onOpen?: () => void } = {},
) {
  const fixtureStore = new DisposableStore();
  surface.className = 'specimen';
  surface.style.cssText = `width:${options.width ?? 320}px`;
  const iconStyle = document.createElement('style');
  iconStyle.textContent = getIconsStyleSheet(undefined).getCSS();
  document.head.append(iconStyle);
  let config: ExplorerExample;
  let nodes = new Map<string, any>();
  let languagePaths = new Map<string, string>();
  let decorationsMap = new Map<string, any>();
  let tree: ObjectTree<any, any>;
  let list: List<any>;
  let panes: SourcePane[] = [];
  let paneView: PaneView;
  let rootItems: ExplorerItem[] = [];
  let groups: any[] = [];
  const disposable = () => ({ dispose() {} });
  const keybindings = { lookupKeybinding: () => undefined };
  const hover = getBaseLayerHoverDelegate();
  const theme: any = {
    getColorTheme: () => ({
      type: root.classList.contains('vs')
        ? 'light'
        : root.classList.contains('hc-light')
          ? 'hcLight'
          : root.classList.contains('hc-black')
            ? 'hcDark'
            : 'dark',
      getColor: (id: string) =>
        Color.Format.CSS.parse(
          getComputedStyle(root)
            .getPropertyValue(`--vscode-${id.replaceAll('.', '-')}`)
            .trim(),
        ) || undefined,
    }),
    onDidColorThemeChange: Event.None,
    getFileIconTheme: () => ({
      hasFileIcons: true,
      hasFolderIcons: false,
      hidesExplorerArrows: false,
    }),
    onDidFileIconThemeChange: Event.None,
  };
  const contextView = new ContextView(root, ContextViewDOMPosition.FIXED);
  const menus = new ContextMenuHandler(
    {
      showContextView: (delegate) => contextView.show(delegate),
      hideContextView: (data) => contextView.hide(data),
    } as any,
    { publicLog2() {} } as any,
    { error: console.error } as any,
    keybindings as any,
  );
  const settings: any = {
    explorer: {
      decorations: { colors: true, badges: true },
      fileNesting: { enabled: false },
    },
    workbench: {
      tree: { indent: 8 },
      view: { alwaysShowHeaderActions: false },
    },
  };
  const configuration: any = {
    onDidChangeConfiguration: Event.None,
    getValue: (key?: string) =>
      key
        ? key.split('.').reduce((value, part) => value?.[part], settings)
        : settings,
  };
  const workspace: any = {
    onDidChangeWorkspaceFolders: Event.None,
    getWorkbenchState: () => (config.roots.length > 1 ? 3 : 2),
    getWorkspaceFolder: (uri: URI) =>
      config.roots
        .map((item, index) => ({
          uri: URI.file(item.path),
          name: item.name,
          index,
        }))
        .find((folder) => extUri.isEqualOrParent(uri, folder.uri)),
    getWorkspace: () => ({
      folders: config.roots.map((item, index) => ({
        uri: URI.file(item.path),
        name: item.name,
        index,
      })),
    }),
  };
  const languages: any = {
    onDidChange: Event.None,
    guessLanguageIdByFilepathOrFirstLine: (uri: URI) =>
      languagePaths.get(uri.path) || null,
  };
  const models: any = {
    getModel: () => null,
    onModelLanguageChanged: Event.None,
    onModelAdded: Event.None,
  };
  const labelService: any = {
    onDidChangeFormatters: Event.None,
    getUriLabel: (uri: URI) => uri.path,
    getSeparator: () => '/',
  };
  const textFiles: any = {
    untitled: { onDidChangeLabel: Event.None, get: () => undefined },
  };
  const decorations = new DecorationsService({ extUri } as any, theme);
  decorations.registerDecorationsProvider({
    label: 'Fixture decorations',
    onDidChange: Event.None,
    provideDecorations: (uri: URI) => {
      const value = decorationsMap.get(uri.path);
      return value
        ? {
            letter: value.badge,
            color: value.color,
            tooltip: value.tooltip,
            strikethrough: value.strikethrough,
          }
        : undefined;
    },
  });
  const workingCopies: any = {
    get hasDirty() {
      return config.editorGroups?.some((group) =>
        group.editors.some((editor) => editor.dirty),
      );
    },
    get dirtyCount() {
      return new Set(
        config.editorGroups?.flatMap((group) =>
          group.editors
            .filter((editor) => editor.dirty)
            .map((editor) => editor.path),
        ) || [],
      ).size;
    },
    onDidChangeDirty: Event.None,
  };
  const commands: any = {
    executeCommand: async (id: string, _unused: any, context: any) => {
      const group = groups.find((group) => group.id === context?.groupId);
      const editor = group?.editors[context?.editorIndex];
      state.actions.push({
        id,
        groupId: group?.fixtureId,
        editorId: editor?.data.id,
      });
    },
  };
  const contexts: any = {
    createScoped: () => contexts,
    createKey: (_id: string, value: any) => ({
      set(next: any) {
        value = next;
      },
      get: () => value,
      reset() {},
    }),
    onDidChangeContext: Event.None,
    contextMatchesRules: () => true,
    dispose() {},
  };
  const viewContainer = { id: 'explorer' };
  const descriptors: any = {
    getViewLocationById: () => 0,
    onDidChangeLocation: Event.None,
    getViewContainerByViewId: () => viewContainer,
    getDefaultContainerById: () => viewContainer,
    getViewContainerModel: () => ({
      title: 'Explorer',
      onDidChangeContainerInfo: Event.None,
    }),
    getViewDescriptorById: () => undefined,
  };
  const instantiation: any = {
    dispose() {},
    createChild: () => instantiation,
    createInstance: (Ctor: any, ...args: any[]) => {
      if (Ctor.name === 'ResourceLabelWidget')
        return new Ctor(
          ...args,
          languages,
          models,
          decorations,
          labelService,
          textFiles,
          workspace,
          { getNotebook: () => undefined },
        );
      if (Ctor === WorkbenchToolBar)
        return new Ctor(
          args[0],
          args[1],
          {} as any,
          {} as any,
          menus as any,
          keybindings as any,
          {} as any,
          { publicLog2() {} } as any,
        );
      if (Ctor.name === 'ViewMenuActions')
        return {
          dispose() {},
          onDidChange: Event.None,
          getPrimaryActions: () => [],
          getSecondaryActions: () => [],
          getContextMenuActions: () => [],
        };
      if (
        ['CloseEditorAction', 'UnpinEditorAction', 'CloseGroupAction'].includes(
          Ctor.name,
        )
      )
        return new Ctor(...args, commands);
      if (Ctor.name === 'SaveAllInGroupAction')
        return new Ctor(
          ...args,
          commands,
          { error: console.error },
          workingCopies,
        );
      throw new Error(`Explorer fixture dependency: ${Ctor.name}`);
    },
  };
  const resourceLabels = () =>
    new ResourceLabels(
      { onDidChangeVisibility: Event.None },
      instantiation,
      configuration,
      models,
      workspace,
      languages,
      decorations,
      theme,
      labelService,
      textFiles,
    );
  function action(id: string, label: string, icon: string) {
    return new Action(id, label, `codicon codicon-${icon}`, true, async () => {
      state.actions.push({ id });
      if (id === 'collapseAll') tree.collapseAll();
    });
  }
  function actions(which: 'files' | 'editors') {
    return which === 'files'
      ? [
          action('newFile', 'New File...', 'new-file'),
          action('newFolder', 'New Folder...', 'new-folder'),
          action('refresh', 'Refresh Explorer', 'refresh'),
          action('collapseAll', 'Collapse Folders in Explorer', 'collapse-all'),
        ]
      : [
          ...(groups.length > 1
            ? [
                action(
                  'toggleLayout',
                  'Toggle Vertical/Horizontal Editor Layout',
                  'editor-layout',
                ),
              ]
            : []),
          action('saveAll', 'Save All', 'save-all'),
          action('closeAll', 'Close All Editors', 'close-all'),
        ];
  }
  class TitlePart extends CompositePart<any> {
    minimumWidth = 0;
    maximumWidth = Infinity;
    minimumHeight = 0;
    maximumHeight = Infinity;
    constructor(host: HTMLElement) {
      super(
        { error: console.error } as any,
        new InMemoryStorageService(),
        menus as any,
        { registerPart: disposable } as any,
        keybindings as any,
        hover as any,
        instantiation,
        theme,
        {} as any,
        'fixture.explorer',
        '',
        'sideBar',
        'viewlet',
        'sideBarTitle.foreground',
        'sideBarTitle.border',
        'fixture.explorer',
        { hasTitle: true, trailingSeparator: false },
      );
      this.titleArea = this.createTitleArea(host);
      this.titleLabel!.updateTitle('explorer', 'Explorer');
      this.titleLabel!.updateStyles();
      this.toolBar!.setActions(
        [],
        actionsForMenu(
          [
            {
              id: 'openEditors',
              label: 'Open Editors',
              checked: config.showOpenEditors !== false,
            },
            { id: 'folders', label: 'Folders', checked: true },
          ],
          (id) => state.actions.push({ id }),
        ),
      );
      this.titleArea!.classList.add('has-actions');
    }
    toJSON() {
      return {};
    }
  }
  class Input extends EditorInput {
    readonly resource: URI;
    constructor(readonly data: any) {
      super();
      this.resource = URI.file(data.path);
    }
    get typeId() {
      return 'fixture.explorer';
    }
    override getName() {
      return this.data.name;
    }
    override getDescription() {
      return this.data.description;
    }
    override getTitle() {
      return this.data.path;
    }
    override isDirty() {
      return !!this.data.dirty;
    }
    override isSaving() {
      return !!this.data.saving;
    }
  }
  function openEditor(
    row: any,
    pinned = false,
    preserveFocus = true,
    sideBySide = false,
  ) {
    if (row instanceof OpenEditor)
      state.opens.push({
        id: row.editor.data.id,
        source: 'editors',
        groupId: row.group.fixtureId,
        pinned,
        preserveFocus,
        sideBySide,
      });
    options.onOpen?.();
  }
  class SourcePane extends ViewPane {
    which: 'files' | 'editors';
    workingCopyService = workingCopies;
    dirtyCountElement!: HTMLElement;
    constructor(which: 'files' | 'editors') {
      super(
        {
          id: `fixture.${which}`,
          title:
            which === 'editors'
              ? 'Open Editors'
              : config.workspaceName ||
                (config.roots.length === 1 ? config.roots[0].name : 'Folders'),
          expanded:
            which === 'editors'
              ? config.openEditorsExpanded !== false
              : config.foldersExpanded !== false,
        },
        keybindings as any,
        menus as any,
        configuration,
        contexts,
        descriptors,
        instantiation,
        {} as any,
        theme,
        hover as any,
      );
      this.which = which;
      if (which === 'editors') {
        const count = groups.reduce((sum, group) => sum + group.editors.length + (groups.length > 1 ? 1 : 0), 0);
        this.minimumBodySize = Math.min(Math.max(config.visibleEditors ?? 9, 1), count) * 22;
        this.maximumBodySize = count * 22;
      }
      (this as any).menuActions.getPrimaryActions = () => actions(which);
    }
    protected override renderHeaderTitle(
      container: HTMLElement,
      title: string,
    ) {
      if (this.which === 'editors')
        (OpenEditorsView.prototype as any).renderHeaderTitle.call(
          this,
          container,
        );
      else super.renderHeaderTitle(container, title);
    }
    updateDirtyIndicator() {
      (OpenEditorsView.prototype as any).updateDirtyIndicator.call(this);
    }
    openFirstDirtyEditor() {
      const row = groups
        .flatMap((group) =>
          group.editors.map((editor: any) => new OpenEditor(editor, group)),
        )
        .find((row: any) => row.editor.isDirty());
      openEditor(row, true, false);
    }
    protected override renderBody(container: HTMLElement) {
      if (this.which === 'files') makeTree(container);
      else makeEditors(container);
    }
    protected override layoutBody(height: number, width: number) {
      if (this.which === 'files') tree.layout(height, width);
      else list.layout(height, width);
    }
  }
  function layoutPanes() {
    paneView?.layout(Math.max(0,(config.height ?? 500)-35), options.width ?? 320);
  }
  function makeTree(container: HTMLElement) {
    const host = document.createElement('div');
    host.className =
      'explorer-folders-view file-icon-themable-tree show-file-icons';
    container.append(host);
    const explorer: any = {
      getEditableData: () => undefined,
      isEditable: () => false,
      isCut: (stat: any) => nodes.get(stat.resource.path)?.cut,
      sortOrderConfiguration: {
        sortOrder: 'default',
        lexicographicOptions: 'default',
        reverse: false,
      },
    };
    const labels = fixtureStore.add(resourceLabels());
    const renderer = fixtureStore.add(
      new FilesRenderer(
        host,
        labels,
        { get: () => 0 } as any,
        () => {},
        contextView as any,
        theme,
        configuration,
        explorer,
        labelService,
        workspace,
        menus as any,
        instantiation,
      ),
    );
    const sorter = new FileSorter(explorer, workspace);
    tree = fixtureStore.add(
      new ObjectTree(
        'Files Explorer',
        host,
        new ExplorerDelegate(),
        [renderer],
        {
          indent: 8,
          renderIndentGuides: RenderIndentGuides.OnHover,
          multipleSelectionSupport: true,
          expandOnlyOnTwistieClick: false,
          horizontalScrolling: false,
          smoothScrolling: false,
          paddingBottom: 22,
          sorter,
          accessibilityProvider: renderer,
          identityProvider: { getId: (item: any) => item.resource.toString() },
          keyboardNavigationLabelProvider: {
            getKeyboardNavigationLabel: (item: any) => item.name,
          },
        },
      ),
    );
    const elements = (items: any[]) =>
      items.map((element) => ({
        element,
        collapsed: element.isDirectory
          ? !(config.expandedIds || []).includes(
              nodes.get(element.resource.path).id,
            )
          : undefined,
        children: element.isDirectory
          ? elements([...element.children.values()])
          : undefined,
      }));
    tree.setChildren(
      null,
      elements(
        config.roots.length === 1
          ? [...rootItems[0].children.values()]
          : rootItems,
      ),
    );
    tree.style({
      ...defaultListStyles,
      listBackground: 'var(--vscode-sideBar-background)',
    });
    if (config.selectedIds)
      tree.setSelection(
        [...nodes]
          .filter(([_path, node]) => config.selectedIds!.includes(node.id))
          .map(([path]) => findItem(path)!),
      );
    tree.onDidChangeFocus(
      (e) =>
        (state.fileFocus = e.elements.map(
          (item) => nodes.get(item.resource.path).id,
        )),
    );
    tree.onDidChangeSelection(
      (e) =>
        (state.fileSelection = e.elements.map(
          (item) => nodes.get(item.resource.path).id,
        )),
    );
    tree.onDidChangeCollapseState(
      () =>
        (state.expanded = [...nodes]
          .filter(
            ([path, node]) =>
              node.kind === 'folder' &&
              findItem(path) &&
              tree.hasElement(findItem(path)!) &&
              !tree.isCollapsed(findItem(path)!),
          )
          .map(([_path, node]) => node.id)),
    );
    const navigator = fixtureStore.add(
      new TreeResourceNavigator(tree, { openOnSingleClick: true }),
    );
    navigator.onDidOpen((e) => {
      if (
        e.element &&
        !e.element.isDirectory &&
        !(e.browserEvent instanceof KeyboardEvent && e.browserEvent.shiftKey)
      )
        state.opens.push({
          id: nodes.get(e.element.resource.path).id,
          source: 'files',
          pinned: e.editorOptions.pinned,
          preserveFocus: e.editorOptions.preserveFocus,
          sideBySide: e.sideBySide,
        });
      options.onOpen?.();
    });
    tree.onContextMenu((e) => {
      state.contexts.push({
        source: 'files',
        id: e.element ? nodes.get(e.element.resource.path).id : undefined,
      });
      if (config.contextActions?.length)
        menus.showContextMenu({
          getAnchor: () => e.anchor,
          getActions: () =>
            actionsForMenu(config.contextActions!, (id) =>
              state.actions.push({ id }),
            ),
          getActionsContext: () => undefined,
        });
    });
  }
  function findItem(path: string): ExplorerItem | undefined {
    const visit = (item: ExplorerItem): ExplorerItem | undefined =>
      item.resource.path === path
        ? item
        : [...item.children.values()].map(visit).find(Boolean);
    return rootItems.map(visit).find(Boolean);
  }
  function makeEditors(container: HTMLElement) {
    container.classList.add('open-editors', 'show-file-icons');
    const labels = fixtureStore.add(resourceLabels());
    list = fixtureStore.add(
      new List(
        'OpenEditors',
        container,
        new OpenEditorsDelegate(),
        [
          new EditorGroupRenderer(keybindings, instantiation),
          new OpenEditorRenderer(
            labels,
            instantiation,
            keybindings,
            configuration,
          ),
        ],
        {
          multipleSelectionSupport: true,
          horizontalScrolling: false,
          smoothScrolling: false,
          identityProvider: {
            getId: (item: any) =>
              item instanceof OpenEditor
                ? item.editor.data.id
                : `group:${item.fixtureId}`,
          },
          keyboardNavigationLabelProvider: {
            getKeyboardNavigationLabel: (item: any) =>
              item instanceof OpenEditor ? item.editor.getName() : item.label,
          },
          accessibilityProvider: {
            getWidgetAriaLabel: () => 'Open Editors',
            getAriaLabel: (item: any) =>
              item instanceof OpenEditor
                ? `${item.editor.getName()}, ${item.editor.getDescription()}`
                : item.ariaLabel,
          },
        },
      ),
    );
    const rows = groups.flatMap((group) => [
      ...(groups.length > 1 ? [group] : []),
      ...group.editors.map((editor: any) => new OpenEditor(editor, group)),
    ]);
    list.splice(0, 0, rows);
    list.style({
      ...defaultListStyles,
      listBackground: 'var(--vscode-sideBar-background)',
    });
    const active = rows.findIndex(
      (row) =>
        row instanceof OpenEditor &&
        row.editor.data.id === config.activeEditorId,
    );
    if (active >= 0) {
      list.setFocus([active]);
      list.setSelection([active]);
    }
    list.onDidChangeFocus(
      (e) =>
        (state.editorFocus = e.elements.map((row) =>
          row instanceof OpenEditor
            ? row.editor.data.id
            : `group:${row.fixtureId}`,
        )),
    );
    list.onDidChangeSelection(
      (e) =>
        (state.editorSelection = e.elements.map((row) =>
          row instanceof OpenEditor
            ? row.editor.data.id
            : `group:${row.fixtureId}`,
        )),
    );
    const navigator = fixtureStore.add(
      new ListResourceNavigator(list, { openOnSingleClick: true }),
    );
    navigator.onDidOpen((e) => {
      if (!(
        e.browserEvent instanceof MouseEvent && e.browserEvent.button === 1
      ))
        openEditor(
          e.element,
          e.editorOptions.pinned,
          e.editorOptions.preserveFocus,
          e.sideBySide,
        );
    });
    list.onMouseMiddleClick((e) => {
      if (e.element instanceof OpenEditor)
        commands.executeCommand(
          'workbench.action.closeActiveEditor',
          undefined,
          {
            groupId: e.element.groupId,
            editorIndex: e.element.group.getIndexOfEditor(e.element.editor),
          },
        );
    });
  }
  function show(index: number) {
    fixtureStore.clear();
    surface.replaceChildren();
    panes = [];
    config = structuredClone(explorerExamples[index]);
    if (options.height !== undefined) config.height = options.height;
    nodes = new Map();
    languagePaths = new Map();
    decorationsMap = new Map();
    Object.assign(state, {
      actions: [],
      opens: [],
      contexts: [],
      fileFocus: [],
      fileSelection: config.selectedIds?.slice() || [],
      editorFocus: config.activeEditorId ? [config.activeEditorId] : [],
      editorSelection: config.activeEditorId ? [config.activeEditorId] : [],
      expanded: config.expandedIds?.slice() || [],
      expansion: [],
    });
    function make(item: any, parent?: ExplorerItem): ExplorerItem {
      nodes.set(item.path, item);
      if (item.language) languagePaths.set(item.path, item.language);
      if (item.decoration) decorationsMap.set(item.path, item.decoration);
      const value = new ExplorerItem(
        URI.file(item.path),
        { hasCapability: () => false } as any,
        configuration,
        { isReadonly: () => false } as any,
        parent,
        item.kind === 'folder' || !!item.children,
        false,
        false,
        false,
        item.name,
      );
      for (const child of item.children || [])
        value.addChild(make(child, value));
      return value;
    }
    rootItems = config.roots.map((item) => make(item));
    groups = (config.editorGroups || []).map((group, index) => ({
      id: index + 1,
      fixtureId: group.id,
      label: group.label,
      ariaLabel: group.label,
      editors: group.editors.map((editor) => {
        if (editor.language) languagePaths.set(editor.path, editor.language);
        if (editor.decoration)
          decorationsMap.set(editor.path, editor.decoration);
        return new Input(editor);
      }),
      isPinned: (editor: Input) => !editor.data.preview,
      isSticky: (editor: Input) => !!editor.data.sticky,
      getIndexOfEditor(editor: Input) {
        return this.editors.indexOf(editor);
      },
    }));
    const part = document.createElement('div');
    part.className = 'part sidebar';
    part.style.cssText = `height:${config.height ?? 500}px;background:var(--vscode-sideBar-background);color:var(--vscode-sideBar-foreground,var(--vscode-foreground))`;
    surface.append(part);
    fixtureStore.add(new TitlePart(part));
    const body = document.createElement('div');
    body.className = 'content composite explorer-viewlet';
    part.append(body);
    body.style.height = `${(config.height ?? 500)-35}px`;
    paneView = fixtureStore.add(new PaneView(body));
    for (const which of [
      ...(config.showOpenEditors !== false ? ['editors' as const] : []),
      'files' as const,
    ]) {
      const pane = fixtureStore.add(new SourcePane(which));
      panes.push(pane);
      pane.render();
      const size = which === 'editors' ? 22 + pane.minimumBodySize : Math.max(142,(config.height ?? 500)-35-(panes[0].which === 'editors' ? 22+panes[0].minimumBodySize : 0));
      paneView.addPane(pane,size);
      pane.style({
        headerForeground: 'var(--vscode-sideBarSectionHeader-foreground)',
        headerBackground: 'var(--vscode-sideBarSectionHeader-background)',
        headerBorder: 'var(--vscode-sideBarSectionHeader-border)',
        leftBorder: undefined,
        dropBackground: undefined,
      });
      pane.onDidChangeExpansionState((expanded) => {
        state.expansion.push({ section: which, expanded });
      });
    }
    layoutPanes();
    (window as any).fixtureExplorer = {
      resize: (width: number, height: number) => { options.width = width; options.height = height; config.height = height; surface.style.width = `${width}px`; part.style.height = `${height}px`; body.style.height = `${height-35}px`; layoutPanes(); },
      focusFiles: () => tree.domFocus(),
      focusEditors: () => list.domFocus(),
      collapseAll: () => tree.collapseAll(),
      snapshot: () => structuredClone(state),
    };
  }
  (window as any).fixtureShowExplorer = show;
  show(Number(new URLSearchParams(location.search).get('case') || 0));
}
