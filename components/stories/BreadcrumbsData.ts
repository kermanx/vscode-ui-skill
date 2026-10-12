import type { BreadcrumbItem } from '../src/components/breadcrumbs/types';
const path: BreadcrumbItem[] = [
  { id: 'src', label: 'src', kind: 'folder' }, { id: 'editor', label: 'editor', kind: 'folder' },
  { id: 'file', label: 'editor.ts', kind: 'file', icon: 'file-code' },
];
const symbols: BreadcrumbItem[] = [...path, { id: 'class', label: 'Editor', kind: 'symbol', icon: 'symbol-class' }, { id: 'method', label: 'render()', kind: 'symbol', icon: 'symbol-method', description: 'void' }];
export const breadcrumbExamples: { items: BreadcrumbItem[]; disabled?: boolean; scrollbarSize?: 'default' | 'large'; scrollbarVisibility?: 'auto' | 'visible' | 'hidden' }[] = [
  { items: path }, { items: symbols },
  { items: [{ id: 'single', label: 'README.md', kind: 'file', icon: 'markdown' }] },
  { items: path, disabled: true },
  { items: [...symbols, { id:'old', label:'deprecatedMethod', kind:'symbol', icon:'symbol-method', deprecated:true }], scrollbarSize:'large' },
  { items: Array.from({ length: 9 }, (_, i) => ({ id: `folder${i}`, label: `directory-${i}`, kind:'folder' as const })), scrollbarVisibility:'visible' },
  { items: [{ id:'long', label:'A very long document name that exceeds the available breadcrumb width.ts', kind:'file', icon:'file-code' }, {id:'last',label:'main',kind:'symbol',icon:'symbol-function'}], scrollbarVisibility:'hidden' },
  { items: [] },
];
export function breadcrumbEventText(index: number, event: { type: string; item?: BreadcrumbItem; payload?: unknown }) {
  return `${index}:${event.type}:${event.item?.id ?? '-'}:${event.payload instanceof MouseEvent || (event.payload as any)?.browserEvent ? 'mouse' : String(event.payload ?? '-')}`;
}
