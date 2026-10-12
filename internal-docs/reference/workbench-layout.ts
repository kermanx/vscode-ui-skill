// Native SerializableGrid with the classic Layout.createGridDescriptor center/bottom arrangement.
import {
  SerializableGrid,
  Orientation,
  LayoutPriority,
} from "../../vscode/src/vs/base/browser/ui/grid/grid.js";
import { Event } from "../../vscode/src/vs/base/common/event.js";
import {
  workbenchParts,
  workbenchPartStyle,
  type WorkbenchPart,
} from "../../components/stories/WorkbenchLayoutData";
export function mountWorkbenchLayout(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
  options: { height?: string } = {},
) {
  surface.className = "specimen";
  surface.style.height = options.height || "520px";
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, {
    sidebarVisible: true,
    panelVisible: true,
    activityBarVisible: true,
    statusBarVisible: true,
    sidebarWidth: 220,
    panelHeight: 180,
  });
  let gridReady = false;
  const views = Object.fromEntries(
    workbenchParts.map((id) => {
      const element = document.createElement("div");
      element.dataset.workbenchPart = id;
      Object.assign(element.style, {
        width: "100%",
        height: "100%",
        overflow: "hidden",
      });
      const content = document.createElement("div");
      Object.assign(content.style, workbenchPartStyle(id));
      content.textContent = id;
      element.append(content);
      const view = {
        element,
        preferredWidth: id === "sidebar" ? 300 : undefined,
        get preferredHeight() {
          return id === "panel" ? surface.clientHeight * 0.4 : undefined;
        },
        minimumWidth:
          id === "activity"
            ? 48
            : id === "sidebar"
              ? 170
              : id === "panel"
                ? 300
                : id === "editor"
                  ? 220
                  : 0,
        maximumWidth: id === "activity" ? 48 : Infinity,
        minimumHeight:
          id === "status" ? 22 : id === "panel" ? 77 : id === "editor" ? 70 : 0,
        maximumHeight: id === "status" ? 22 : Infinity,
        priority:
          id === "editor"
            ? LayoutPriority.High
            : id === "sidebar"
              ? LayoutPriority.Low
              : LayoutPriority.Normal,
        snap: id === "sidebar" || id === "panel" || id === "editor",
        onDidChange: Event.None,
        layout() {
          if (gridReady) queueMicrotask(sync);
        },
        toJSON: () => ({ type: id }),
      };
      return [id, view];
    }),
  ) as Record<WorkbenchPart, any>;
  const width = surface.clientWidth,
    height = surface.clientHeight;
  const leaf = (type: WorkbenchPart, size: number) => ({
    type: "leaf",
    data: { type },
    size,
    visible: true,
  });
  const editor = {
    type: "branch",
    size: width - 268,
    data: [leaf("editor", height - 22 - 180), leaf("panel", 180)],
  };
  const columns =
    new URLSearchParams(location.search).get("side") === "right"
      ? [editor, leaf("sidebar", 220), leaf("activity", 48)]
      : [leaf("activity", 48), leaf("sidebar", 220), editor];
  const grid = SerializableGrid.deserialize(
    {
      orientation: Orientation.VERTICAL,
      width,
      height,
      root: {
        type: "branch",
        size: width,
        data: [
          { type: "branch", size: height - 22, data: columns },
          leaf("status", 22),
        ],
      },
    } as any,
    { fromJSON: ({ type }: any) => views[type as WorkbenchPart] },
    { proportionalLayout: false },
  );
  surface.append(grid.element);
  grid.layout(width, height);
  function sync() {
    state.sidebarWidth = grid.isViewVisible(views.sidebar)
      ? grid.getViewSize(views.sidebar).width
      : state.sidebarWidth;
    state.panelHeight = grid.isViewVisible(views.panel)
      ? grid.getViewSize(views.panel).height
      : state.panelHeight;
    state.sidebarVisible = grid.isViewVisible(views.sidebar);
    state.panelVisible = grid.isViewVisible(views.panel);
  }
  gridReady = true;
  const resize = new ResizeObserver(() => {
    grid.layout(surface.clientWidth, surface.clientHeight);
    sync();
  });
  resize.observe(surface);
  (window as any).fixtureApi = {
    set: (value: any) => {
      Object.assign(state, value);
      for (const [key, part] of [
        ["sidebarVisible", "sidebar"],
        ["panelVisible", "panel"],
        ["activityBarVisible", "activity"],
        ["statusBarVisible", "status"],
      ] as const)
        if (value[key] !== undefined)
          grid.setViewVisible(views[part], value[key]);
      if (value.sidebarWidth !== undefined)
        grid.resizeView(views.sidebar, { width: value.sidebarWidth });
      if (value.panelHeight !== undefined)
        grid.resizeView(views.panel, { height: value.panelHeight });
      sync();
    },
  };
  (window as any).fixtureReady = true;
  return { grid, views, api: (window as any).fixtureApi };
}
