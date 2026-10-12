// Real Sash instances; pane positioning is fixture-owned, just as SplitView owns layout constraints.
import { Sash, Orientation, SashState, OrthogonalEdge, type ISashEvent } from '../../vscode/src/vs/base/browser/ui/sash/sash.js';
import { sashLayout, type SashId } from '../../components/stories/SashData';
export function mountSash(root:HTMLElement, surface:HTMLElement, state:any) {
  for (const key of Object.keys(state)) delete state[key];
  const layout = { ...sashLayout }; Object.assign(state, { layout, events:[], bubbled:0 });
  surface.addEventListener('mousedown', () => state.bubbled++);
  const forcedStates = { disabled:SashState.Disabled, minimum:SashState.AtMinimum, maximum:SashState.AtMaximum, enabled:SashState.Enabled };
  let forced = new URLSearchParams(location.search).get('state') as keyof typeof forcedStates | null;
  const sashes = new Map<SashId, Sash>(); const starts = new Map<SashId, number>();
  function div(parent:HTMLElement, css:string, text?:string) { const el = document.createElement('div'); el.style.cssText = css; el.textContent = text || ''; parent.append(el); return el; }
  const split = div(surface, 'position:relative;height:120px;overflow:visible'); split.dataset.demo = 'split';
  const explorer = div(split, 'position:absolute;left:0px;top:0px;height:100%;box-sizing:border-box;padding:8px;border-right:1px solid var(--vscode-sideBarSectionHeader-border)', 'Explorer');
  const editor = div(split, 'position:absolute;top:0px;right:0px;height:100%;padding:8px;box-sizing:border-box', 'Editor');
  const grid = div(surface, 'position:relative;height:144px;overflow:visible'); grid.dataset.demo = 'grid';
  const gridContent = div(grid, 'position:absolute;inset:0');
  div(gridContent, 'position:absolute;left:8px;top:8px', 'Top left');
  const topRight = div(gridContent, 'position:absolute;top:8px', 'Top right');
  const bottomLeft = div(gridContent, 'position:absolute;left:8px', 'Bottom left');
  const bottomRight = div(gridContent, 'position:absolute', 'Bottom right');
  const boundary = div(surface, 'position:relative;height:80px;overflow:visible'); boundary.dataset.demo = 'boundary';
  const boundaryContent = div(boundary, 'position:absolute;top:0px;border:1px solid var(--vscode-sideBarSectionHeader-border);box-sizing:border-box;padding:8px', 'Orthogonal boundary corners');
  const frame = document.createElement('iframe'); frame.title = 'Embedded content'; frame.srcdoc = "<body style='margin:0;font:13px sans-serif'>Embedded content</body>"; frame.style.cssText = 'height:28px;width:100%;border:0'; surface.append(frame);
  const key = (id:SashId) => id === 'main' ? 'main' : id === 'grid-horizontal' ? 'gridY' : id === 'grid-top' || id === 'grid-bottom' ? 'gridX' : id === 'boundary-left' ? 'boundaryLeft' : id === 'boundary-right' ? 'boundaryRight' : 'boundaryBottom';
  function render() {
    explorer.style.width = `${layout.main}px`; editor.style.left = `${layout.main}px`;
    topRight.style.left = `${layout.gridX + 8}px`; bottomLeft.style.top = `${layout.gridY + 8}px`; bottomRight.style.left = `${layout.gridX + 8}px`; bottomRight.style.top = `${layout.gridY + 8}px`;
    boundaryContent.style.left = `${layout.boundaryLeft}px`; boundaryContent.style.width = `${layout.boundaryRight-layout.boundaryLeft}px`; boundaryContent.style.height = `${layout.boundaryBottom}px`;
    const main = sashes.get('main'); if (main) main.state = forced ? forcedStates[forced] : layout.main <= 80 ? SashState.AtMinimum : layout.main >= split.clientWidth-80 ? SashState.AtMaximum : SashState.Enabled;
    for (const sash of sashes.values()) sash.layout();
  }
  function record(id:SashId, phase:string, event?:ISashEvent) {
    state.events.push({ id, phase, ...(event ? { event } : {}) });
    if (phase === 'start') starts.set(id, layout[key(id)]);
    if (phase === 'change' && event) {
      const horizontal = id === 'grid-horizontal' || id === 'boundary-bottom';
      const value = (starts.get(id) ?? 0) + (horizontal ? event.currentY-event.startY : event.currentX-event.startX);
      if (id === 'main') layout.main = Math.max(80, Math.min(split.clientWidth-80, value));
      else if (id === 'grid-horizontal') layout.gridY = Math.max(24, Math.min(120, value));
      else if (id === 'grid-top' || id === 'grid-bottom') layout.gridX = Math.max(40, Math.min(split.clientWidth-40, value));
      else layout[key(id)] = value;
    }
    if (phase === 'reset') layout[key(id)] = sashLayout[key(id)]; render();
  }
  function create(id:SashId, parent:HTMLElement, provider:any, options:any) {
    const sash = new Sash(parent, provider, options); (parent.lastElementChild as HTMLElement).dataset.sash = id; sashes.set(id,sash);
    sash.onDidStart(event => record(id,'start',event)); sash.onDidChange(event => record(id,'change',event)); sash.onDidEnd(() => record(id,'end')); sash.onDidReset(() => record(id,'reset')); return sash;
  }
  function createMain() { return create('main',split,{ getVerticalSashLeft:() => layout.main },{ orientation:Orientation.VERTICAL }); }
  createMain();
  const horizontal = create('grid-horizontal',grid,{ getHorizontalSashTop:() => layout.gridY },{ orientation:Orientation.HORIZONTAL });
  const top = create('grid-top',grid,{ getVerticalSashLeft:() => layout.gridX, getVerticalSashHeight:() => layout.gridY },{ orientation:Orientation.VERTICAL,orthogonalEndSash:horizontal });
  const bottom = create('grid-bottom',grid,{ getVerticalSashLeft:() => layout.gridX,getVerticalSashTop:() => layout.gridY,getVerticalSashHeight:() => 144-layout.gridY },{ orientation:Orientation.VERTICAL,orthogonalStartSash:horizontal });
  top.linkedSash = bottom; bottom.linkedSash = top;
  const left = create('boundary-left',boundary,{ getVerticalSashLeft:() => layout.boundaryLeft,getVerticalSashHeight:() => layout.boundaryBottom },{ orientation:Orientation.VERTICAL });
  const right = create('boundary-right',boundary,{ getVerticalSashLeft:() => layout.boundaryRight,getVerticalSashHeight:() => layout.boundaryBottom },{ orientation:Orientation.VERTICAL });
  create('boundary-bottom',boundary,{ getHorizontalSashTop:() => layout.boundaryBottom,getHorizontalSashLeft:() => layout.boundaryLeft,getHorizontalSashWidth:() => layout.boundaryRight-layout.boundaryLeft },{ orientation:Orientation.HORIZONTAL,orthogonalStartSash:left,orthogonalEndSash:right,orthogonalEdge:OrthogonalEdge.South });
  render(); new ResizeObserver(render).observe(split);
  function button(className:string,label:string,run:() => void) { const el = document.createElement('button'); el.className = className; el.textContent = label; el.onclick = run; root.append(el); }
  button('fixture-state','Toggle disabled',() => { forced = forced === 'disabled' ? 'enabled' : 'disabled'; render(); });
  button('fixture-boundary','Toggle boundary',() => { horizontal.state = horizontal.state === SashState.Disabled ? SashState.Enabled : SashState.Disabled; });
  button('fixture-unmount','Toggle main sash',() => { const main = sashes.get('main'); if (main) { main.dispose(); sashes.delete('main'); } else createMain(); render(); });
  (window as any).referenceSashes = sashes;
}
