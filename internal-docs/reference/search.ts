// Independent oracle: actual SearchWidget, pattern widgets, SearchView methods and result renderers.
import { IContextKeyService } from '../../vscode/src/vs/platform/contextkey/common/contextkey.js';
import { SearchWidget } from '../../vscode/src/vs/workbench/contrib/search/browser/searchWidget.js';
import { SearchView } from '../../vscode/src/vs/workbench/contrib/search/browser/searchView.js';
import {
  IncludePatternInputWidget,
  ExcludePatternInputWidget,
} from '../../vscode/src/vs/workbench/contrib/search/browser/patternInputWidget.js';
import {
  SearchDelegate,
  FileMatchRenderer,
  MatchRenderer,
  SearchAccessibilityProvider,
} from '../../vscode/src/vs/workbench/contrib/search/browser/searchResultsView.js';
import { ObjectTree } from '../../vscode/src/vs/base/browser/ui/tree/objectTree.js';
import { TreeResourceNavigator } from '../../vscode/src/vs/platform/list/browser/listService.js';
import { RenderIndentGuides } from '../../vscode/src/vs/base/browser/ui/tree/abstractTree.js';
import { ResourceLabels } from '../../vscode/src/vs/workbench/browser/labels.js';
import { DecorationsService } from '../../vscode/src/vs/workbench/services/decorations/browser/decorationsService.js';
import { CompositePart } from '../../vscode/src/vs/workbench/browser/parts/compositePart.js';
import {
  WorkbenchToolBar,
  MenuWorkbenchToolBar,
} from '../../vscode/src/vs/platform/actions/browser/toolbar.js';
import { InMemoryStorageService } from '../../vscode/src/vs/platform/storage/common/storage.js';
import {
  defaultInputBoxStyles,
  defaultToggleStyles,
  defaultListStyles,
} from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { getIconsStyleSheet } from '../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js';
import { getBaseLayerHoverDelegate } from '../../vscode/src/vs/base/browser/ui/hover/hoverDelegate2.js';
import {
  ContextView,
  ContextViewDOMPosition,
} from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { URI } from '../../vscode/src/vs/base/common/uri.js';
import { extUri } from '../../vscode/src/vs/base/common/resources.js';
import { Event, Emitter } from '../../vscode/src/vs/base/common/event.js';
import { Action } from '../../vscode/src/vs/base/common/actions.js';
import { Color } from '../../vscode/src/vs/base/common/color.js';
import { DisposableStore } from '../../vscode/src/vs/base/common/lifecycle.js';
import '../../vscode/src/vs/workbench/contrib/search/browser/media/searchview.css';
import '../../vscode/src/vs/workbench/browser/parts/sidebar/media/sidebarpart.css';
import './explorer-assets/seti.css';
import {
  searchExamples,
  type SearchExample,
} from '../../components/stories/SearchData';
import { actionsForMenu } from './menu';

export function mountSearch(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
  options: { width?: number; height?: number } = {},
) {
  const store = new DisposableStore();
  surface.className = 'specimen';
  let width = options.width ?? 320;
  surface.style.width = `${width}px`;
  const iconStyle = document.createElement('style');
  iconStyle.textContent = getIconsStyleSheet(undefined).getCSS();
  document.head.append(iconStyle);
  const hover = getBaseLayerHoverDelegate();
  const keybindings: any = {
    lookupKeybinding: () => undefined,
    appendKeybinding: (label: string) => label,
    onDidUpdateKeybindings: Event.None,
  };
  const contextView = new ContextView(root, ContextViewDOMPosition.FIXED);
  const contextProvider: any = {
    showContextView: (delegate: any) => contextView.show(delegate),
    hideContextView: (data: any) => contextView.hide(data),
    layout: () => contextView.layout(),
  };
  const menus = new ContextMenuHandler(
    contextProvider,
    { publicLog2() {} } as any,
    { error: console.error } as any,
    keybindings,
  );
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
  let config: SearchExample,
    widget: SearchWidget,
    includes: IncludePatternInputWidget,
    excludes: ExcludePatternInputWidget,
    tree: ObjectTree<any, any>,
    view: any;
  let searchFiles: any[] = [],
    allNodes: any[] = [];
  const menuChanged = new Emitter<void>();
  function scoped(parent?: any): any {
    const values = new Map<string, any>();
    return {
      get: (id: string) => (values.has(id) ? values.get(id) : parent?.get(id)),
      createScoped() {
        return scoped(this);
      },
      createKey(id: string, initial: any) {
        if (!values.has(id)) values.set(id, initial);
        return {
          get: () => values.get(id),
          set(value: any) {
            if (values.get(id) !== value) {
              values.set(id, value);
              menuChanged.fire();
            }
          },
          reset() {
            values.set(id, initial);
          },
        };
      },
      onDidChangeContext: Event.None,
      contextMatchesRules: () => true,
      bufferChangeEvents: (fn: any) => fn(),
      dispose() {},
    };
  }
  const contexts = scoped();
  const settings: any = {
    search: {
      decorations: { colors: true, badges: true },
      showLineNumbers: false,
      searchOnType: true,
      searchOnTypeDebouncePeriod: 300,
      globalFindClipboard: false,
      actionsPosition: 'right',
      searchView: { semanticSearchBehavior: 'manual' },
    },
    workbench: { tree: { indent: 8 } },
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
    getWorkbenchState: () => 2,
    getWorkspace: () => ({
      folders: [
        {
          uri: URI.file('/workspace/sample-project'),
          name: 'sample-project',
          index: 0,
        },
      ],
    }),
    getWorkspaceFolder: () => ({
      uri: URI.file('/workspace/sample-project'),
      name: 'sample-project',
      index: 0,
    }),
  };
  const labelService: any = {
    onDidChangeFormatters: Event.None,
    getUriLabel: (uri: URI, options?: any) =>
      options?.relative
        ? uri.path.replace(/^\/workspace\/sample-project\/?/, '')
        : uri.path,
    getSeparator: () => '/',
  };
  const languages: any = {
    onDidChange: Event.None,
    guessLanguageIdByFilepathOrFirstLine: (uri: URI) =>
      config.results.find((file) => file.path === uri.path)?.language || null,
  };
  const models: any = {
    getModel: () => null,
    onModelLanguageChanged: Event.None,
    onModelAdded: Event.None,
  };
  const textFiles: any = {
    untitled: { onDidChangeLabel: Event.None, get: () => undefined },
  };
  const decorations = new DecorationsService({ extUri } as any, theme);
  const menuService: any = {
    createMenu: (_id: any, context: any) => ({
      onDidChange: menuChanged.event,
      dispose() {},
      getActions: () => {
        const match = !!context.get('matchFocus');
        const actions: Action[] = [];
        if (widget?.isReplaceActive() && context.get('isEditableItem'))
          actions.push(
            new Action(
              match
                ? 'search.action.replace'
                : 'search.action.replaceAllInFile',
              match ? 'Replace' : 'Replace All',
              'codicon codicon-search-replace',
              true,
              async (ctx: any) => {
                state.replaces.push({
                  id: ctx.element.fixtureId,
                  scope: match ? 'match' : 'file',
                });
              },
            ),
          );
        actions.push(
          new Action(
            'search.action.remove',
            'Dismiss',
            'codicon codicon-search-remove',
            true,
            async (ctx: any) => {
              state.dismisses.push(ctx.element.fixtureId);
            },
          ),
        );
        return [['inline', actions]];
      },
    }),
  };
  const actionViews: any = { lookUp: () => undefined, onDidChange: Event.None };
  function instantiationFor(context = contexts): any {
    const instance: any = {
      dispose() {},
      createChild: () => instantiationFor(context),
      invokeFunction: () => state.actions.push('openInEditor'),
      createInstance: (Ctor: any, ...args: any[]) => {
        if (Ctor.name === 'NotebookFindFilterActionViewItem')
          return new Ctor(...args, menus);
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
            menuService,
            context,
            menus as any,
            keybindings,
            {} as any,
            { publicLog2() {} } as any,
          );
        if (Ctor === MenuWorkbenchToolBar)
          return new Ctor(
            args[0],
            args[1],
            args[2],
            menuService,
            context,
            menus as any,
            keybindings,
            {} as any,
            { publicLog2() {} } as any,
            actionViews,
            instance,
          );
        throw new Error(`Search fixture dependency: ${Ctor.name}`);
      },
    };
    instance.createChild = (services: any) => {
      const next = services?.get(IContextKeyService);
      return instantiationFor(next || context);
    };
    return instance;
  }
  const instantiation = instantiationFor();
  let title: Title | undefined;
  function titleAction(
    id: string,
    label: string,
    icon: string,
    enabled = true,
  ) {
    return new Action(
      id,
      label,
      `codicon codicon-${icon}`,
      enabled,
      async () => {
        state.actions.push(id);
        if (id === 'collapseAll') tree.collapseAll();
        if (id === 'expandAll') tree.expandAll();
      },
    );
  }
  class Title extends CompositePart<any> {
    minimumWidth = 0;
    maximumWidth = Infinity;
    minimumHeight = 0;
    maximumHeight = Infinity;
    constructor(host: HTMLElement) {
      super(
        { error: console.error } as any,
        new InMemoryStorageService(),
        menus as any,
        { registerPart: () => ({ dispose() {} }) } as any,
        keybindings,
        hover as any,
        instantiation,
        theme,
        {} as any,
        'fixture.search',
        '',
        'sideBar',
        'viewlet',
        'sideBarTitle.foreground',
        'sideBarTitle.border',
        'fixture.search',
        { hasTitle: true, trailingSeparator: false },
      );
      this.titleArea = this.createTitleArea(host);
      this.titleLabel!.updateTitle('search', 'Search');
      this.titleLabel!.updateStyles();
      this.refresh(
        config.query || '',
        config.replacement || '',
        config.include || '',
        config.exclude || '',
      );
      this.titleArea!.classList.add('has-actions');
    }
    private actionKey = '';
    refresh(
      query: string,
      replacement: string,
      include: string,
      exclude: string,
    ) {
      const collapsed = config.results.length > 0 && !state.expanded.length;
      const firstEnabled = config.searching || !!query;
      const clearEnabled = !!(
        config.results.length ||
        query ||
        replacement ||
        include ||
        exclude
      );
      const key = JSON.stringify([collapsed, firstEnabled, clearEnabled]);
      if (key === this.actionKey) return;
      this.actionKey = key;
      this.toolBar!.setActions(
        [
          titleAction(
            config.searching ? 'cancel' : 'refresh',
            config.searching ? 'Cancel Search' : 'Refresh',
            config.searching ? 'search-stop' : 'search-refresh',
            firstEnabled,
          ),
          titleAction(
            'clear',
            'Clear Search Results',
            'search-clear-results',
            clearEnabled,
          ),
          titleAction(
            collapsed ? 'expandAll' : 'collapseAll',
            collapsed ? 'Expand All' : 'Collapse All',
            collapsed ? 'search-expand-results' : 'search-collapse-results',
            !!config.results.length,
          ),
        ],
        [],
      );
    }
    toJSON() {
      return {};
    }
  }
  function snapshot() {
    Object.assign(state, {
      query: widget.searchInput!.getValue(),
      replacement: widget.getReplaceValue(),
      matchCase: widget.searchInput!.getCaseSensitive(),
      wholeWord: widget.searchInput!.getWholeWords(),
      regex: widget.searchInput!.getRegex(),
      preserveCase: widget.replaceInput!.getPreserveCase(),
      replaceShown: widget.isReplaceShown(),
      detailsShown: view.queryDetails.classList.contains('more'),
      include: includes.getValue(),
      exclude: excludes.getValue(),
      onlyOpenEditors: includes.onlySearchInOpenEditors(),
      onlyChangedFiles: includes.onlySearchInChangedFiles(),
      useIgnoreFiles: excludes.useExcludesAndIgnoreFiles(),
    });
    title?.refresh(
      state.query,
      state.replacement,
      state.include,
      state.exclude,
    );
  }
  function submit(triggeredOnType: boolean, delay: number) {
    snapshot();
    const {
      query,
      replacement,
      matchCase,
      wholeWord,
      regex,
      preserveCase,
      include,
      exclude,
      onlyOpenEditors,
      onlyChangedFiles,
      useIgnoreFiles,
    } = state;
    state.submits.push({
      query,
      replacement,
      matchCase,
      wholeWord,
      regex,
      preserveCase,
      include,
      exclude,
      onlyOpenEditors,
      onlyChangedFiles,
      useIgnoreFiles,
      triggeredOnType,
      delay,
    });
  }
  function rerender() {
    for (const node of allNodes) if (tree.hasElement(node)) tree.rerender(node);
  }
  function show(index: number) {
    store.clear();
    surface.replaceChildren();
    config = structuredClone(searchExamples[index]);
    if (options.height !== undefined) config.height = options.height;
    settings.search.showLineNumbers = !!config.showLineNumbers;
    settings.search.searchOnType = config.searchOnType !== false;
    settings.search.searchOnTypeDebouncePeriod = config.searchDelay ?? 300;
    Object.assign(state, {
      actions: [],
      submits: [],
      cancels: [],
      replaces: [],
      dismisses: [],
      opens: [],
      contexts: [],
      resultFocus: [],
      resultSelection: config.selectedIds?.slice() || [],
      expanded: config.expandedIds?.slice() || [],
    });
    const part = document.createElement('div');
    part.className = 'part sidebar';
    part.style.cssText = `height:${config.height ?? 500}px;background:var(--vscode-sideBar-background);color:var(--vscode-sideBar-foreground,var(--vscode-foreground))`;
    surface.append(part);
    title = store.add(new Title(part));
    const body = document.createElement('div');
    body.className = 'pane-body';
    body.style.height = `${(config.height ?? 500) - 35}px`;
    part.append(body);
    const container = document.createElement('div');
    container.className = 'search-view actions-right';
    body.append(container);
    const widgets = document.createElement('div');
    widgets.className = 'search-widgets-container';
    container.append(widgets);
    widget = store.add(
      new SearchWidget(
        widgets,
        {
          value: config.query,
          replaceValue: config.replacement,
          isRegex: config.regex,
          isCaseSensitive: config.matchCase,
          isWholeWords: config.wholeWord,
          preserveCase: config.preserveCase,
          searchHistory: config.searchHistory as string[],
          replaceHistory: config.replaceHistory as string[],
          inputBoxStyles: defaultInputBoxStyles,
          toggleStyles: defaultToggleStyles,
        },
        contextProvider,
        contexts,
        keybindings,
        { readFindText: async () => '', writeFindText: async () => {} } as any,
        configuration,
        {
          isScreenReaderOptimized: () => false,
          onDidChangeScreenReaderOptimized: Event.None,
        } as any,
        menus as any,
        instantiation,
        { onDidEditorsChange: Event.None, editors: [] } as any,
      ),
    );
    if (config.replaceShown !== false) widget.toggleReplace(true);
    widget.setReplaceAllActionState(
      !!config.searched && config.results.some((file) => file.matches.length),
    );
    const details = document.createElement('div');
    details.className = 'query-details';
    widgets.append(details);
    const more = document.createElement('div');
    more.className = 'more codicon codicon-search-details';
    more.tabIndex = 0;
    more.setAttribute('role', 'button');
    more.setAttribute('aria-label', 'Toggle Search Details');
    details.append(more);
    store.add(
      hover.setupManagedHover(
        {
          delay: 300,
          showHover: (options) => hover.showHover(options),
          dispose() {},
        } as any,
        more,
        'Toggle Search Details',
      ),
    );
    function pattern(label: string, kind: string) {
      const box = document.createElement('div');
      box.className = `file-types ${kind}`;
      const title = document.createElement('h4');
      title.textContent = label;
      box.append(title);
      details.append(box);
      return box;
    }
    includes = store.add(
      new IncludePatternInputWidget(
        pattern('files to include', 'includes'),
        contextProvider,
        {
          ariaLabel: 'files to include',
          placeholder: 'e.g. *.ts, src/**/include',
          showPlaceholderOnFocus: true,
          history: config.includeHistory as string[],
          inputBoxStyles: defaultInputBoxStyles,
        },
        contexts,
        configuration,
        keybindings,
      ),
    );
    includes.setValue(config.include || '');
    includes.setOnlySearchInOpenEditors(!!config.onlyOpenEditors);
    includes.setOnlySearchInChangedFilesEnabled(!!config.changedFilesAvailable);
    includes.setOnlySearchInChangedFiles(!!config.onlyChangedFiles);
    excludes = store.add(
      new ExcludePatternInputWidget(
        pattern('files to exclude', 'excludes'),
        contextProvider,
        {
          ariaLabel: 'files to exclude',
          placeholder: 'e.g. *.ts, src/**/exclude',
          showPlaceholderOnFocus: true,
          history: config.excludeHistory as string[],
          inputBoxStyles: defaultInputBoxStyles,
        },
        contexts,
        configuration,
        keybindings,
      ),
    );
    excludes.setValue(config.exclude || '');
    excludes.setUseExcludesAndIgnoreFiles(config.useIgnoreFiles !== false);
    const messages = document.createElement('div');
    messages.className = 'messages text-search-provider-messages';
    container.append(messages);
    const results = document.createElement('div');
    results.className = 'results show-file-icons file-icon-themable-tree';
    container.append(results);
    const resultModel: any = {
      query: { contentPattern: { pattern: config.query || '' } },
      aiTextSearchResult: { hidden: true },
      isEmpty: () => !config.results.length,
      getCachedSearchComplete: () => undefined,
      fileCount: () => config.results.length,
      count: () =>
        config.results.reduce((sum, file) => sum + file.matches.length, 0),
    };
    view = {
      contextKeyService: contexts,
      contextService: workspace,
      onSearchAgain: () => state.actions.push('searchAll'),
      onOpenSettings: () => state.actions.push('openSettings'),
      getContainer: () => container,
      isDisposed: false,
      searchConfig: settings.search,
      size: { width, height: (config.height ?? 500) - 35 },
      searchWidget: widget,
      inputPatternIncludes: includes,
      inputPatternExcludes: excludes,
      searchIncludePattern: includes,
      searchExcludePattern: excludes,
      searchWidgetsContainerElement: widgets,
      messagesElement: messages,
      queryDetails: details,
      toggleQueryDetailsButton: more,
      viewletState: { query: {} },
      isTreeLayoutViewVisible: false,
      getControl: () => tree,
      model: {
        isReplaceActive: () => widget.isReplaceActive(),
        get replaceString() {
          return widget.getReplaceValue();
        },
      },
      viewModel: { searchResult: resultModel },
      searchResult: resultModel,
      _cachedKeywords: [],
      hasSearchResultsKey: { set() {} },
      messageDisposables: store.add(new DisposableStore()),
      keybindingService: keybindings,
      hoverService: hover,
      instantiationService: instantiation,
      shouldShowAIResults: () => false,
    };
    for (const method of [
      'reLayout',
      'toggleQueryDetails',
      'clearMessage',
      'buildResultCountMessage',
      'updateSearchResultCount',
      'onEnableExcludes',
      'onDisableSearchInOpenEditors',
    ])
      view[method] = (...args: any[]) =>
        (SearchView.prototype as any)[method].apply(view, args);
    const labels = store.add(
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
      ),
    );
    const folder: any = {
      id: () => 'FOLDER_MATCH_root',
      createAndConfigureFileMatch() {},
    };
    searchFiles = config.results.map((file) => {
      const data: any = {
        fixtureId: file.id,
        id: () => `FILE_MATCH_${file.id}`,
        resource: URI.file(file.path),
        name: () => file.name,
        count: () => file.matches.length,
        parent: () => folder,
        hasOnlyReadOnlyMatches: () =>
          file.matches.every((match) => match.readonly),
        onChange: Event.None,
      };
      data.matches = () =>
        file.matches.map((match) => ({
          fixtureId: match.id,
          fileId: file.id,
          id: () => `MATCH_${match.id}`,
          parent: () => data,
          preview: () => ({
            before: match.before,
            fullBefore: match.before,
            inside: match.text,
            after: match.after,
          }),
          range: () => ({
            startLineNumber: match.line,
            endLineNumber: match.endLine ?? match.line,
            startColumn: match.before.length + 1,
            endColumn: match.before.length + match.text.length + 1,
          }),
          getMatchString: () => match.text,
          text: () => match.before + match.text + match.after,
          get replaceString() {
            return match.replacement ?? widget.getReplaceValue();
          },
          isReadonly: !!match.readonly,
        }));
      return data;
    });
    allNodes = searchFiles.flatMap((file) => [file, ...file.matches()]);
    tree = store.add(
      new ObjectTree(
        'SearchView',
        results,
        new SearchDelegate(),
        [
          new FileMatchRenderer(
            view,
            labels,
            workspace,
            configuration,
            instantiation,
            contexts,
          ),
          new MatchRenderer(
            view,
            workspace,
            configuration,
            instantiation,
            contexts,
            hover as any,
          ),
        ],
        {
          indent: 8,
          renderIndentGuides: RenderIndentGuides.OnHover,
          multipleSelectionSupport: true,
          selectionNavigation: true,
          paddingBottom: 22,
          horizontalScrolling: false,
          smoothScrolling: false,
          accessibilityProvider: new SearchAccessibilityProvider(
            view,
            labelService,
          ),
          identityProvider: { getId: (item: any) => item.id() },
          keyboardNavigationLabelProvider: {
            getKeyboardNavigationLabel: (item: any) =>
              item.name?.() || item.text(),
          },
        },
      ),
    );
    // SearchView normally receives an async tree; ObjectTree names the same membership check hasElement.
    (tree as any).hasNode = (element: any) => tree.hasElement(element);
    view.tree = tree;
    const elements = searchFiles.map((file) => ({
      element: file,
      collapsed: !config.expandedIds?.includes(file.fixtureId),
      children: allNodes
        .filter((item) => item.fileId === file.fixtureId)
        .map((element) => ({ element })),
    }));
    tree.setChildren(null, elements);
    tree.style({
      ...defaultListStyles,
      listBackground: 'var(--vscode-sideBar-background)',
    });
    if (config.selectedIds)
      tree.setSelection(
        allNodes.filter((item) => config.selectedIds!.includes(item.fixtureId)),
      );
    tree.onDidChangeFocus(
      (e) => (state.resultFocus = e.elements.map((item) => item.fixtureId)),
    );
    tree.onDidChangeSelection(
      (e) => (state.resultSelection = e.elements.map((item) => item.fixtureId)),
    );
    tree.onDidChangeCollapseState(() => {
      state.expanded = searchFiles
        .filter((file) => !tree.isCollapsed(file))
        .map((file) => file.fixtureId);
      snapshot();
    });
    const navigator = store.add(
      new TreeResourceNavigator(tree, { openOnSingleClick: true }),
    );
    navigator.onDidOpen((e) => {
      if (e.element?.fileId)
        state.opens.push({
          id: e.element.fixtureId,
          fileId: e.element.fileId,
          pinned: e.editorOptions.pinned,
          preserveFocus: e.editorOptions.preserveFocus,
          sideBySide: e.sideBySide,
        });
    });
    tree.onContextMenu((e) => {
      state.contexts.push(e.element?.fixtureId);
      if (config.contextActions?.length)
        menus.showContextMenu({
          getAnchor: () => e.anchor,
          getActions: () =>
            actionsForMenu(config.contextActions!, (id) =>
              state.actions.push(id),
            ),
          getActionsContext: () => undefined,
        });
    });
    view.toggleQueryDetails(false, !!config.detailsShown, true);
    view.reLayout();
    if (config.searched && config.results.length)
      view.updateSearchResultCount(
        config.useIgnoreFiles === false,
        !!config.onlyOpenEditors,
      );
    else if (config.searched) {
      (SearchView.prototype as any).onSearchComplete.call(
        view,
        () => {},
        config.exclude,
        config.include,
        {},
        false,
      );
    } else messages.style.display = 'none';
    view.reLayout();
    more.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.toggleQueryDetails(true);
      snapshot();
    };
    more.onkeyup = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        view.toggleQueryDetails(false);
        snapshot();
      }
    };
    widget.onSearchSubmit((e) => submit(e.triggeredOnType, e.delay));
    widget.onSearchCancel((e) => state.cancels.push(e.focus));
    widget.onReplaceAll(() => state.replaces.push({ scope: 'all' }));
    widget.onReplaceToggled(() => {
      menuChanged.fire();
      rerender();
      view.reLayout();
      snapshot();
    });
    widget.onReplaceStateChange(() => {
      menuChanged.fire();
      rerender();
    });
    widget.onDidHeightChange(() => view.reLayout());
    widget.onReplaceValueChanged(() => {
      rerender();
      snapshot();
    });
    widget.searchInput!.onDidChange(() => snapshot());
    widget.searchInput!.onDidOptionChange(() => {
      snapshot();
      submit(false, 0);
    });
    widget.replaceInput!.onDidOptionChange(() => snapshot());
    widget.onBlur(() => more.focus());
    includes.onSubmit((onType) => {
      snapshot();
      submit(onType, settings.search.searchOnTypeDebouncePeriod);
    });
    excludes.onSubmit((onType) => {
      snapshot();
      submit(onType, settings.search.searchOnTypeDebouncePeriod);
    });
    includes.onCancel(() => state.cancels.push(false));
    excludes.onCancel(() => state.cancels.push(false));
    includes.onChangeSearchInEditorsBox(() => submit(false, 0));
    includes.onChangeSearchInChangedFilesBox(() => submit(false, 0));
    excludes.onChangeIgnoreBox(() => submit(false, 0));
    snapshot();
    (window as any).fixtureSearch = {
      resize: (nextWidth: number, height: number) => {
        width = nextWidth;
        config.height = height;
        surface.style.width = `${width}px`;
        part.style.height = `${height}px`;
        body.style.height = `${height - 35}px`;
        view.size = { width, height: height - 35 };
        view.reLayout();
      },
      focus: () => widget.focus(),
      focusResults: () => tree.domFocus(),
      submit: () => (widget as any).submitSearch(),
      complete: () => {
        widget.setReplaceAllActionState(config.results.length > 0);
        rerender();
        menuChanged.fire();
      },
      snapshot: () => {
        snapshot();
        return structuredClone(state);
      },
    };
  }
  (window as any).fixtureShowSearch = show;
  show(Number(new URLSearchParams(location.search).get('case') || 0));
}
