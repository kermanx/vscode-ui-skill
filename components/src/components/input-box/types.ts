export interface InputBoxMessage {
  content: string;
  type: 'info' | 'warning' | 'error';
}
export interface InputBoxAction {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
}
export interface InputBoxSelection {
  start: number;
  end: number;
}
