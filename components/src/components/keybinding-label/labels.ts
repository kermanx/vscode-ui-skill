/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/** Modifier labels and separators for each supported platform. */

import type { OperatingSystem } from './types';

export interface ModifierLabels {
  readonly ctrlKey: string;
  readonly shiftKey: string;
  readonly altKey: string;
  readonly metaKey: string;
  readonly separator: string;
}

export const modifierLabels: Readonly<Record<OperatingSystem, ModifierLabels>> =
  {
    macintosh: {
      ctrlKey: '\u2303',
      shiftKey: '\u21e7',
      altKey: '\u2325',
      metaKey: '\u2318',
      separator: '',
    },
    windows: {
      ctrlKey: 'Ctrl',
      shiftKey: 'Shift',
      altKey: 'Alt',
      metaKey: 'Windows',
      separator: '+',
    },
    linux: {
      ctrlKey: 'Ctrl',
      shiftKey: 'Shift',
      altKey: 'Alt',
      metaKey: 'Super',
      separator: '+',
    },
  };

/**
 * Copy of `AriaLabelProvider` minus the localization call: the same strings are produced for
 * the default (English) locale. The source order ctrl → shift → alt → meta is kept.
 */
export const ariaModifierLabels: Readonly<
  Record<OperatingSystem, ModifierLabels>
> = {
  macintosh: {
    ctrlKey: 'Control',
    shiftKey: 'Shift',
    altKey: 'Option',
    metaKey: 'Command',
    separator: '+',
  },
  windows: {
    ctrlKey: 'Control',
    shiftKey: 'Shift',
    altKey: 'Alt',
    metaKey: 'Windows',
    separator: '+',
  },
  linux: {
    ctrlKey: 'Control',
    shiftKey: 'Shift',
    altKey: 'Alt',
    metaKey: 'Super',
    separator: '+',
  },
};
