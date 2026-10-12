export type SettingsTarget = 'user' | 'workspace';
export interface SettingOption {
  value: string | number | boolean | null;
  label?: string;
  description?: string;
}
/** Scalar settings and opaque values edited by the host in JSON. */
export interface SettingDefinition {
  key: string;
  type:
    | 'boolean'
    | 'string'
    | 'number'
    | 'integer'
    | 'enum'
    | 'multiline'
    | 'complex';
  defaultValue: unknown;
  description: string;
  title?: string;
  categoryLabel?: string;
  options?: readonly SettingOption[];
  tags?: readonly string[];
  validator?: (value: string) => string | undefined;
  deprecationMessage?: string;
}
export interface SettingsGroup {
  id: string;
  label: string;
  settings: readonly SettingDefinition[];
}
/** Only explicit overrides are stored; missing keys render defaultValue. */
export type SettingsValues = Record<SettingsTarget, Record<string, unknown>>;
export interface SettingChange {
  key: string;
  /** undefined removes the override, allowing defaultValue to appear again. */
  value: unknown;
  target: SettingsTarget;
  manualReset: boolean;
}
