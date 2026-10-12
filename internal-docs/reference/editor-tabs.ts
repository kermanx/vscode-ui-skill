// Real MultiEditorTabsControl and EditorGroupModel; only workbench service boundaries are replaced.
import { MultiEditorTabsControl } from "../../vscode/src/vs/workbench/browser/parts/editor/multiEditorTabsControl.js";
import { DEFAULT_EDITOR_PART_OPTIONS } from "../../vscode/src/vs/workbench/browser/parts/editor/editor.js";
import { EditorGroupModel } from "../../vscode/src/vs/workbench/common/editor/editorGroupModel.js";
import { EditorInput } from "../../vscode/src/vs/workbench/common/editor/editorInput.js";
import {
  EditorInputCapabilities,
  EditorsOrder,
} from "../../vscode/src/vs/workbench/common/editor.js";
import { Color } from "../../vscode/src/vs/base/common/color.js";
import { URI } from "../../vscode/src/vs/base/common/uri.js";
import { ThemeIcon } from "../../vscode/src/vs/base/common/themables.js";
import { Event } from "../../vscode/src/vs/base/common/event.js";
import { Dimension } from "../../vscode/src/vs/base/browser/dom.js";
import { posix } from "../../vscode/src/vs/base/common/path.js";
import { InstantiationService } from "../../vscode/src/vs/platform/instantiation/common/instantiationService.js";
import { ServiceCollection } from "../../vscode/src/vs/platform/instantiation/common/serviceCollection.js";
import { IConfigurationService } from "../../vscode/src/vs/platform/configuration/common/configuration.js";
import { TestConfigurationService } from "../../vscode/src/vs/platform/configuration/test/common/testConfigurationService.js";
import { ContextKeyService } from "../../vscode/src/vs/platform/contextkey/browser/contextKeyService.js";
import { IContextKeyService } from "../../vscode/src/vs/platform/contextkey/common/contextkey.js";
import { IContextMenuService } from "../../vscode/src/vs/platform/contextview/browser/contextView.js";
import { IKeybindingService } from "../../vscode/src/vs/platform/keybinding/common/keybinding.js";
import { INotificationService } from "../../vscode/src/vs/platform/notification/common/notification.js";
import { IQuickInputService } from "../../vscode/src/vs/platform/quickinput/common/quickInput.js";
import { IThemeService } from "../../vscode/src/vs/platform/theme/common/themeService.js";
import {
  TestThemeService,
  TestColorTheme,
} from "../../vscode/src/vs/platform/theme/test/common/testThemeService.js";
import { ColorScheme } from "../../vscode/src/vs/platform/theme/common/theme.js";
import { IEditorService } from "../../vscode/src/vs/workbench/services/editor/common/editorService.js";
import { IPathService } from "../../vscode/src/vs/workbench/services/path/common/pathService.js";
import { ITreeViewsDnDService } from "../../vscode/src/vs/editor/common/services/treeViewsDndService.js";
import { TreeViewsDnDService } from "../../vscode/src/vs/editor/common/services/treeViewsDnd.js";
import { IEditorResolverService } from "../../vscode/src/vs/workbench/services/editor/common/editorResolverService.js";
import { IHostService } from "../../vscode/src/vs/workbench/services/host/browser/host.js";
import { IMenuService } from "../../vscode/src/vs/platform/actions/common/actions.js";
import { IFileService } from "../../vscode/src/vs/platform/files/common/files.js";
import { ILanguageService } from "../../vscode/src/vs/editor/common/languages/language.js";
import { IModelService } from "../../vscode/src/vs/editor/common/services/model.js";
import { IWorkspaceContextService } from "../../vscode/src/vs/platform/workspace/common/workspace.js";
import { ILabelService } from "../../vscode/src/vs/platform/label/common/label.js";
import { ITextFileService } from "../../vscode/src/vs/workbench/services/textfile/common/textfiles.js";
import { INotebookDocumentService } from "../../vscode/src/vs/workbench/services/notebook/common/notebookDocumentService.js";
import { IDecorationsService } from "../../vscode/src/vs/workbench/services/decorations/common/decorations.js";
import { DecorationsService } from "../../vscode/src/vs/workbench/services/decorations/browser/decorationsService.js";
import { IEditorGroupsService } from "../../vscode/src/vs/workbench/services/editor/common/editorGroupsService.js";
import { ICommandService } from "../../vscode/src/vs/platform/commands/common/commands.js";
import "../../vscode/src/vs/workbench/browser/parts/editor/media/editorgroupview.css";
import { editorTabsCase } from "../../components/stories/EditorTabsData";
import type { EditorTab } from "../../components/src/components/editor-tabs/types";

export function mountEditorTabs(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
  host: { focusEditor?: () => void; onChange?: () => void } = {},
) {
  const services = new ServiceCollection();
  const instantiation = new InstantiationService(services, true);
  const config = new TestConfigurationService({
    "workbench.editor.openPositioning": "last",
    "workbench.editor.focusRecentEditorAfterClose": false,
  });
  services.set(IConfigurationService, config);
  services.set(
    IContextKeyService,
    instantiation.createInstance(ContextKeyService),
  );
  const css = getComputedStyle(root),
    colors: Record<string, string> = {};
  for (const key of Array.from(root.style))
    if (key.startsWith("--vscode-"))
      colors[key.slice(9).replaceAll("-", ".")] = css
        .getPropertyValue(key)
        .trim();
  const type = root.classList.contains("hc-black")
    ? ColorScheme.HIGH_CONTRAST_DARK
    : root.classList.contains("hc-light")
      ? ColorScheme.HIGH_CONTRAST_LIGHT
      : root.classList.contains("vs")
        ? ColorScheme.LIGHT
        : ColorScheme.DARK;
  const colorTheme = new TestColorTheme(colors, type);
  colorTheme.getColor = (id: string) =>
    colors[id] ? Color.Format.CSS.parse(colors[id]) : undefined;
  const theme = new TestThemeService(colorTheme);
  root.classList.add("file-icons-enabled");
  services.set(IThemeService, theme);
  services.set(IContextMenuService, {
    showContextMenu: (delegate: any) => {
      const editor = model.getEditorByIndex(
        delegate.getActionsContext().editorIndex,
      ) as FixtureEditor;
      state.context.push(editor.entry.id);
    },
    onDidShowContextMenu: Event.None,
    onDidHideContextMenu: Event.None,
  } as any);
  services.set(IKeybindingService, {
    lookupKeybinding: () => undefined,
  } as any);
  services.set(INotificationService, {
    error: (error: unknown) => {
      throw error;
    },
  } as any);
  services.set(IQuickInputService, {} as any);
  services.set(IEditorService, {
    onDidActiveEditorChange: Event.None,
    onDidVisibleEditorsChange: Event.None,
  } as any);
  services.set(IPathService, { path: Promise.resolve(posix) } as any);
  services.set(ITreeViewsDnDService, new TreeViewsDnDService());
  services.set(IEditorResolverService, { getEditors: () => [] } as any);
  services.set(IHostService, { onDidChangeFocus: Event.None } as any);
  services.set(IMenuService, {
    getMenuActions: () => [],
    createMenu: () => ({
      getActions: () => [],
      onDidChange: Event.None,
      dispose() {},
    }),
  } as any);
  services.set(IFileService, {
    hasProvider: () => true,
    onDidChangeFileSystemProviderRegistrations: Event.None,
  } as any);
  services.set(ILanguageService, {
    onDidChange: Event.None,
    guessLanguageIdByFilepathOrFirstLine: () => "plaintext",
  } as any);
  services.set(IModelService, {
    getModel: () => undefined,
    onModelAdded: Event.None,
    onModelLanguageChanged: Event.None,
  } as any);
  services.set(IWorkspaceContextService, {
    onDidChangeWorkspaceFolders: Event.None,
    getWorkspaceFolder: () => undefined,
  } as any);
  services.set(ILabelService, {
    onDidChangeFormatters: Event.None,
    getUriLabel: (uri: URI) => uri.path,
  } as any);
  services.set(ITextFileService, {
    untitled: { onDidChangeLabel: Event.None, get: () => undefined },
  } as any);
  services.set(INotebookDocumentService, {
    getNotebook: () => undefined,
  } as any);
  services.set(
    IDecorationsService,
    new DecorationsService(
      { extUri: { ignorePathCasing: () => false } } as any,
      {} as any,
    ),
  );
  const model = instantiation.createInstance(EditorGroupModel, undefined);
  const scenario = editorTabsCase(
    new URLSearchParams(location.search).get("variant") || "default",
  );
  class FixtureEditor extends EditorInput {
    constructor(readonly entry: EditorTab) {
      super();
    }
    readonly resource = URI.file(`/project/${this.entry.label}`);
    get typeId() {
      return "fixture.editor";
    }
    get capabilities() {
      return (
        (this.entry.cannotClose ? EditorInputCapabilities.CannotClose : 0) |
        (this.entry.forceDescription
          ? EditorInputCapabilities.ForceDescription
          : 0)
      );
    }
    getName() {
      return this.entry.label;
    }
    getDescription() {
      return this.entry.description || "";
    }
    getTitle() {
      return this.entry.title || this.entry.label;
    }
    getIcon() {
      return ThemeIcon.fromId(this.entry.icon || "file");
    }
    isDirty() {
      return !!this.entry.dirty;
    }
  }
  state.configurePreview = 0;
  window.addEventListener(
    "fixture-markdown-link",
    () => state.configurePreview++,
  );
  const inputs = scenario.items.map((entry) => new FixtureEditor(entry));
  inputs.forEach((editor, index) =>
    model.openEditor(editor, {
      index,
      pinned: !editor.entry.preview,
      active: editor.entry.id === scenario.activeId,
      sticky: editor.entry.sticky,
    }),
  );
  const options: any = {
    ...DEFAULT_EDITOR_PART_OPTIONS,
    editorActionsLocation: "hidden",
    showTabs: "multiple",
    showIcons: true,
    ...toOptions(scenario.options),
  };
  function toOptions(value: any) {
    const names: Record<string, string> = {
      compact: "tabHeight",
      showIndex: "showTabIndex",
      sizing: "tabSizing",
      fixedMinWidth: "tabSizingFixedMinWidth",
      fixedMaxWidth: "tabSizingFixedMaxWidth",
      stickySizing: "pinnedTabSizing",
      actionLocation: "tabActionLocation",
      reserveActionSpace: "tabActionReserveSpace",
      showClose: "tabActionCloseVisibility",
      showUnpin: "tabActionUnpinVisibility",
      scrollbar: "titleScrollbarVisibility",
      scrollbarSize: "titleScrollbarSizing",
      preventStickyClose: "preventPinnedEditorClose",
      doubleClickAction: "doubleClickTabToToggleEditorGroupSizes",
    };
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "active")
        .map(([key, value]) => [
          names[key] || key,
          key === "compact" ? (value ? "compact" : "default") : value,
        ]),
    );
  }
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, {
    close: [],
    pin: [],
    unpin: [],
    groupSize: [],
    context: [],
    configurePreview: 0,
  });
  const group: any = {
    id: model.id,
    get count() {
      return model.count;
    },
    get stickyCount() {
      return model.stickyCount;
    },
    get activeEditor() {
      return model.activeEditor;
    },
    get selectedEditors() {
      return model.selectedEditors;
    },
    ariaLabel: "Editor Group 1",
    getEditorByIndex: (index: number) => model.getEditorByIndex(index),
    getIndexOfEditor: (editor: EditorInput) => model.indexOf(editor),
    getEditors: (...args: any[]) => (model.getEditors as any)(...args),
    isActive: (editor: EditorInput) => model.isActive(editor),
    isPinned: (editor: any) => model.isPinned(editor),
    isSticky: (editor: any) => model.isSticky(editor),
    isSelected: (editor: EditorInput) => model.isSelected(editor),
    createEditorActions: () => ({
      actions: { primary: [], secondary: [] },
      onDidChange: Event.None,
    }),
    relayout: () => layout(),
    focus() { host.focusEditor?.(); },
    onDidActiveEditorChange: Event.None,
    openEditor: async (
      editor: EditorInput,
      openOptions: any,
      internal: any,
    ) => {
      if (!editor) return;
      if (model.indexOf(editor) < 0) {
        model.openEditor(editor, { active: true, pinned: openOptions?.pinned || editor.isDirty() });
      } else if (openOptions?.pinned) {
        model.pin(editor);
      }
      model.setSelection(editor, internal?.inactiveSelection || []);
      control.openEditor(editor, internal);
      if (internal?.focusTabControl)
        title.querySelector<HTMLElement>(".tab.active")?.focus();
      sync();
      if (!openOptions?.preserveFocus) {
        await Promise.resolve();
        host.focusEditor?.();
      }
    },
    setSelection: async (editor: EditorInput, others: EditorInput[]) => {
      model.setSelection(editor, others);
      control.updateEditorSelections();
      control.openEditor(editor);
      sync();
    },
    closeEditor: async (editor: EditorInput) => {
      const restoreFocus = model.isActive(editor) &&
        (document.activeElement === document.body || surface.contains(document.activeElement));
      state.close.push((editor as FixtureEditor).entry.id);
      control.beforeCloseEditor(editor);
      model.closeEditor(editor);
      control.closeEditor(editor);
      sync();
      if (restoreFocus) host.focusEditor?.();
    },
    closeEditors: async (editors: EditorInput[]) => {
      for (const editor of editors) await group.closeEditor(editor);
    },
    pinEditor: (editor: EditorInput) => {
      model.pin(editor);
      control.pinEditor(editor);
      state.pin.push((editor as FixtureEditor).entry.id);
      sync();
    },
  };
  const groups: any = {
    partOptions: options,
    activeGroup: scenario.options.active === false ? {} : group,
    groups: [group],
    onDidChangeEditorPartOptions: Event.None,
    onDidVisibilityChange: Event.None,
    activateGroup() {},
    toggleExpandGroup() {
      state.groupSize.push("expand");
    },
    toggleMaximizeGroup() {
      state.groupSize.push("maximize");
    },
  };
  group.groupsView = groups;
  services.set(IEditorGroupsService, {
    getGroup: () => group,
    activeGroup: group,
  } as any);
  services.set(ICommandService, {
    executeCommand: async (id: string, _: unknown, context: any) => {
      if (
        id === "workbench.action.unpinEditor" ||
        id === "workbench.action.unpinActiveEditor"
      ) {
        const editor = model.getEditorByIndex(context.editorIndex)!;
        model.unstick(editor);
        control.unstickEditor(editor);
        state.unpin.push((editor as FixtureEditor).entry.id);
        sync();
      }
    },
  } as any);
  surface.className = "specimen";
  surface.innerHTML =
    '<div class="part editor editor-tabs-multiple"><div class="content"><div class="editor-group-container"><div class="title tabs show-file-icons"></div></div></div></div>';
  surface
    .querySelector(".editor-group-container")!
    .classList.toggle("active", scenario.options.active !== false);
  const title = surface.querySelector<HTMLElement>(".title")!;
  title.style.background = "var(--vscode-editorGroupHeader-tabsBackground)";
  const control = instantiation.createInstance(
    MultiEditorTabsControl,
    title,
    { count: 1, getGroup: () => group } as any,
    groups,
    group,
    model,
    undefined,
    false,
    false,
  );
  const layout = () =>
    control.layout({
      container: new Dimension(
        surface.clientWidth,
        options.tabHeight === "compact" ? 22 : 35,
      ),
      available: new Dimension(surface.clientWidth, 200),
    });
  function sync() {
    Object.assign(state, {
      active: (model.activeEditor as FixtureEditor)?.entry.id,
      selected: model.selectedEditors.map((e) => (e as FixtureEditor).entry.id),
      items: model
        .getEditors(EditorsOrder.SEQUENTIAL)
        .map((e) => (e as FixtureEditor).entry.id),
    });
    host.onChange?.();
  }
  control.openEditors(model.getEditors(EditorsOrder.SEQUENTIAL));
  control.setActive(scenario.options.active !== false);
  layout();
  sync();
  new ResizeObserver(layout).observe(surface);
  (window as any).fixtureApi = {
    select: (id: string, preserveFocus = false, pinned?: boolean) =>
      group.openEditor(inputs.find((input) => input.entry.id === id), {preserveFocus, pinned}),
    focus: (id?: string) => {
      const index = id
        ? model.indexOf(inputs.find((input) => input.entry.id === id)!)
        : model.indexOf(model.activeEditor!);
      title.querySelectorAll<HTMLElement>(".tab")[index]?.focus();
    },
    options: (value: any) => {
      const old = { ...options };
      Object.assign(options, toOptions(value));
      if (value.active !== undefined) {
        groups.activeGroup = value.active ? group : {};
        surface
          .querySelector(".editor-group-container")!
          .classList.toggle("active", value.active);
        control.setActive(value.active);
      }
      control.updateOptions(old, options);
      layout();
    },
    dirty: (id: string, dirty: boolean) => {
      const editor = inputs.find((input) => input.entry.id === id)!;
      editor.entry.dirty = dirty;
      control.updateEditorDirty(editor);
    },
  };
  (window as any).fixtureReady = true;
}
