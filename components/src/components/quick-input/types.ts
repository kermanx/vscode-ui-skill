// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
export type QuickInputSeverity = 'ignore' | 'info' | 'warning' | 'error';
export type QuickInputHideReason = 'blur' | 'gesture' | 'other';
export interface QuickInputButton {
  id: string;
  icon: string;
  tooltip: string;
}
export interface QuickInputProps {
  title?: string;
  step?: number;
  totalSteps?: number;
  description?: string;
  placeholder?: string;
  ariaLabel?: string;
  password?: boolean;
  prompt?: string;
  validationMessage?: string;
  severity?: QuickInputSeverity;
  /** Makes the input read-only and disables shell actions without dismissing it. */
  enabled?: boolean;
  /** Requests delayed progress feedback; does not disable or execute work. */
  busy?: boolean;
  /** Keeps the surface open on blur; Escape and explicit hiding still work. */
  ignoreFocusOut?: boolean;
  backButton?: boolean;
  buttons?: readonly QuickInputButton[];
  valueSelection?: readonly [number, number];
}
