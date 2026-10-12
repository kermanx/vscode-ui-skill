// A real, visible content target for the isolated bar stories. Workbench mounts
// pass their own content callbacks instead, like CompositePart.openComposite.
import '../../components/stories/compositeContent.css';
import type { CompositeItem } from '../../components/src/components/composite-bar/types';
import type { CompositeBarHostCallbacks } from './composite-bar-host';

export function createCompositeContent(surface: HTMLElement, items: CompositeItem[], kind: 'activity' | 'panel'): CompositeBarHostCallbacks {
  const content = document.createElement('section');
  content.className = `fixture-composite-content ${kind}`;
  content.tabIndex = -1;
  content.dataset.compositeContent = '';
  const title = document.createElement('strong');
  const description = document.createElement('p');
  description.textContent = 'View content receives focus when opened.';
  content.append(title, description);
  surface.after(content);
  function update(id: string) {
    const label = items.find(item => item.id === id)?.label || id;
    title.textContent = label;
    content.setAttribute('aria-label', `${label} content`);
  }
  const params = new URLSearchParams(location.search);
  update(params.get('active') || items[0].id);
  content.hidden = params.get('visible') === 'false';
  return {
    onOpen(id, focus) { update(id); content.hidden = false; if (focus) content.focus(); },
    onVisibility(visible) { content.hidden = !visible; },
  };
}
