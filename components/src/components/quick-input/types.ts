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
  enabled?: boolean;
  busy?: boolean;
  ignoreFocusOut?: boolean;
  backButton?: boolean;
  buttons?: readonly QuickInputButton[];
  valueSelection?: readonly [number, number];
}
