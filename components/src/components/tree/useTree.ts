import { computed, onBeforeUnmount, ref, watch, type ModelRef, type Ref } from 'vue';
import type { TreeNode, TreeRow } from './types';

export function useTree(
  props: { nodes: readonly TreeNode[]; multiple: boolean; expandOnLabel: boolean },
  expanded: ModelRef<string[]>, selected: ModelRef<string[]>,
  element: Ref<HTMLElement | undefined>,
  reveal: (index: number) => void,
  onFocus: (id: string | undefined) => void,
) {
  const focused = ref<string>();
  let anchor: string | undefined;
  let typed = '';
  let typingTimer: ReturnType<typeof setTimeout>;
  const all = computed(() => {
    const map = new Map<string, TreeRow>();
    function visit(nodes: readonly TreeNode[], ancestors: string[]) {
      nodes.forEach((node, position) => {
        map.set(node.id, { node, depth: ancestors.length + 1, ancestors, parent: ancestors.at(-1), position: position + 1, setSize: nodes.length });
        if (node.children) visit(node.children, [...ancestors, node.id]);
      });
    }
    visit(props.nodes, []); return map;
  });
  const expandedSet = computed(() => new Set(expanded.value));
  const rows = computed(() => [...all.value.values()].filter(row => row.ancestors.every(id => expandedSet.value.has(id))));
  const activeGuides = computed(() => {
    const guides = new Set<string>();
    for (const id of [...selected.value, focused.value]) {
      const row = id ? all.value.get(id) : undefined;
      if (!row) continue;
      if (row.node.children?.length && expandedSet.value.has(id!)) guides.add(id!);
      else if (row.parent) guides.add(row.parent);
    }
    return guides;
  });

  function focus(id?: string, scroll = false) {
    if (focused.value !== id) { focused.value = id; onFocus(id); }
    if (scroll && id) reveal(rows.value.findIndex(row => row.node.id === id));
  }
  function toggle(row: TreeRow, recursive = false, force?: boolean) {
    if (!row.node.children?.length) return false;
    const value = force ?? !expandedSet.value.has(row.node.id);
    const next = new Set(expanded.value);
    const changed = next.has(row.node.id) !== value;
    function apply(node: TreeNode) {
      if (!node.children?.length) return;
      if (value) next.add(node.id); else next.delete(node.id);
      if (recursive) node.children.forEach(apply);
    }
    apply(row.node); expanded.value = [...next]; return changed;
  }
  function singleModifier(event: MouseEvent | KeyboardEvent) {
    return /Mac/.test(navigator.platform) ? event.metaKey : event.ctrlKey;
  }
  function click(row: TreeRow, event: MouseEvent, twistie: boolean) {
    const id = row.node.id;
    if (props.multiple && event.shiftKey) {
      anchor ??= focused.value ?? id;
      const ids = rows.value.map(row => row.node.id);
      const a = Math.max(0, ids.indexOf(anchor));
      const b = ids.indexOf(id);
      // Replace only the contiguous selection around the anchor, keeping disjoint selections.
      const previous = new Set([...selected.value, anchor]);
      let first = a, last = a;
      while (first > 0 && previous.has(ids[first - 1])) first--;
      while (last + 1 < ids.length && previous.has(ids[last + 1])) last++;
      const keep = selected.value.filter(key => !ids.slice(first, last + 1).includes(key));
      selected.value = [...new Set([...keep, ...ids.slice(Math.min(a, b), Math.max(a, b) + 1)])];
      focus(id); return;
    }
    if (props.multiple && singleModifier(event)) {
      focus(id); anchor = id;
      selected.value = selected.value.includes(id) ? selected.value.filter(key => key !== id) : [...selected.value, id];
      return;
    }
    if (twistie || props.expandOnLabel || event.detail === 2) {
      if (row.node.children?.length) {
        focus(id); toggle(row, event.altKey);
        if (twistie) return;
      }
    }
    focus(id); anchor = id; selected.value = [id];
  }
  function blank() { focus(); selected.value = []; anchor = undefined; }

  function keydown(event: KeyboardEvent, scrollTop: number, height: number, setScroll: (top: number) => void) {
    const index = rows.value.findIndex(row => row.node.id === focused.value);
    const row = rows.value[index];
    let handled = true;
    switch (event.key) {
      case 'ArrowDown': case 'ArrowUp': {
        const next = index < 0 ? 0 : index + (event.key === 'ArrowDown' ? 1 : -1);
        if (rows.value[next]) focus(rows.value[next].node.id, true);
        anchor = focused.value; break;
      }
      case 'ArrowLeft':
        if (row && !toggle(row, false, false) && row.parent) focus(row.parent, true);
        break;
      case 'ArrowRight':
        if (row && !toggle(row, false, true) && row.node.children?.length) focus(row.node.children[0].id, true);
        break;
      case ' ': if (row) toggle(row, event.altKey); break;
      case 'Enter': selected.value = focused.value ? [focused.value] : []; break;
      case 'Escape':
        if (selected.value.length) { selected.value = []; anchor = undefined; }
        else handled = false;
        break;
      case 'PageDown': case 'PageUp': {
        const down = event.key === 'PageDown';
        let top = scrollTop;
        let edge = down ? Math.max(0, Math.floor((top + height) / 22) - 1) : Math.ceil(top / 22);
        if (index === edge || (down ? index > edge : index < edge)) {
          top = Math.max(0, Math.min(rows.value.length * 22 - height, top + (down ? height : -height)));
          setScroll(top);
          edge = down ? Math.max(0, Math.floor((top + height) / 22) - 1) : Math.ceil(top / 22);
        }
        if (rows.value[edge]) focus(rows.value[edge].node.id, true);
        anchor = focused.value; break;
      }
      default:
        if (event.key.toLowerCase() === 'a' && singleModifier(event) && props.multiple) {
          selected.value = rows.value.map(row => row.node.id); anchor = undefined;
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const delta = typed ? 0 : 1;
          typed += event.key.toLocaleLowerCase();
          clearTimeout(typingTimer); typingTimer = setTimeout(() => { typed = ''; }, 800);
          for (let i = 0; i < rows.value.length; i++) {
            const candidate = rows.value[((index < 0 ? 0 : index) + i + delta) % rows.value.length];
            if (candidate.node.label.toLocaleLowerCase().startsWith(typed)) { focus(candidate.node.id, true); break; }
          }
        } else handled = false;
    }
    if (handled) { event.preventDefault(); event.stopPropagation(); }
  }
  // Data updates preserve stable IDs; removed nodes must not leave dangling ARIA or selection.
  watch(all, map => {
    if (focused.value && !map.has(focused.value)) focus();
    if (selected.value.some(id => !map.has(id))) selected.value = selected.value.filter(id => map.has(id));
    if (expanded.value.some(id => !map.has(id))) expanded.value = expanded.value.filter(id => map.has(id));
  });
  onBeforeUnmount(() => clearTimeout(typingTimer));
  return { rows, all, focused, expandedSet, activeGuides, focus, toggle, click, blank, keydown };
}
