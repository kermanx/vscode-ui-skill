/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/** Operating system whose modifier labels and separator are used. */
export type OperatingSystem = 'macintosh' | 'windows' | 'linux';

/** A modifier/key combination, i.e. one chord of a keybinding. */
export interface Chord {
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  /** Key label for the active operating system, e.g. `K` or `F5`. */
  key?: string;
  /** Long key name used for the accessible name, e.g. `K` or `F5`. */
  keyAriaLabel?: string;
}

/** Which parts of a keybinding are currently matched by the user's input. */
export interface ChordMatches {
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  keyCode?: boolean;
}

export interface Matches {
  /** Match state of the first chord. */
  firstPart?: ChordMatches;
  /** Match state of every following chord. */
  chordPart?: ChordMatches;
}
