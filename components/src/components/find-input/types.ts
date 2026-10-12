export interface FindInputToggle {
  id: string;
  title: string;
  icon: string;
}
export interface FindInputOptionsState {
  matchCase: boolean;
  wholeWord: boolean;
  regex: boolean;
}
export interface FindInputEvent { fromCompositionEnd: boolean }
