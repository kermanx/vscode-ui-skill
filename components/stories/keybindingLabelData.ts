import type { Chord, Matches, OperatingSystem } from '../src/components/keybinding-label/types';

/** One command row: a label plus the shortcut shown at its right edge. */
export interface KeybindingLabelItem {
	id: string;
	label: string;
	os: OperatingSystem;
	chords?: readonly Chord[];
	matches?: Matches;
	disableTitle?: boolean;
}

/**
 * Keybinding labels appear in preference lists and menus (keybindings editor, command
 * palette, menu items): vertical rows with the shortcut right aligned. Every entry below
 * is rendered unchanged by the original fixture and by the replica specimen.
 */
export const items: readonly KeybindingLabelItem[] = [
	{ id: 'save', label: 'Save File', os: 'macintosh', chords: [{ metaKey: true, key: 'S', keyAriaLabel: 'S' }] },
	{ id: 'command-palette', label: 'Show All Commands', os: 'macintosh', chords: [{ metaKey: true, shiftKey: true, key: 'P', keyAriaLabel: 'P' }] },
	{ id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', os: 'macintosh', chords: [{ metaKey: true, key: 'K', keyAriaLabel: 'K' }, { metaKey: true, key: 'S', keyAriaLabel: 'S' }] },
	{ id: 'save-as', label: 'Save As…', os: 'windows', chords: [{ ctrlKey: true, shiftKey: true, key: 'S', keyAriaLabel: 'S' }] },
	{ id: 'format', label: 'Format Document', os: 'windows', chords: [{ shiftKey: true, altKey: true, key: 'F', keyAriaLabel: 'F' }] },
	{ id: 'split-editor', label: 'Split Editor', os: 'linux', chords: [{ ctrlKey: true, key: '\\', keyAriaLabel: '\\' }] },
	{ id: 'unbound', label: 'Toggle Terminal', os: 'macintosh' },
	{ id: 'match-ctrl', label: 'Match: Ctrl down', os: 'windows', chords: [{ ctrlKey: true, key: 'K', keyAriaLabel: 'K' }, { ctrlKey: true, key: 'S', keyAriaLabel: 'S' }], matches: { firstPart: { ctrlKey: true }, chordPart: { ctrlKey: true } } },
	{ id: 'match-key', label: 'Match: Ctrl+K pressed', os: 'windows', chords: [{ ctrlKey: true, key: 'K', keyAriaLabel: 'K' }, { ctrlKey: true, key: 'S', keyAriaLabel: 'S' }], matches: { firstPart: { ctrlKey: true, keyCode: true }, chordPart: { ctrlKey: true } } },
	{ id: 'no-title', label: 'Rename Symbol', os: 'windows', chords: [{ ctrlKey: true, key: 'F2', keyAriaLabel: 'F2' }], disableTitle: true },
];
