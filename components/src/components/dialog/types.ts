export interface DialogButton { label: string; sublabel?: string }
export interface DialogInput { placeholder?: string; type?: 'text' | 'password'; value?: string }
export interface DialogResult { button: number; checkboxChecked?: boolean; values?: string[] }
