import type { SashHandle } from '../sash/types';
import type { ScrollPosition } from '../scrollable-element/types';
export type SplitViewOrientation = 'vertical' | 'horizontal';
export interface SplitViewItem {
  id:string;
  /** Initial size; later size requests use v-model:sizes or resizeView. */
  size?:number;
  minimumSize?:number;
  maximumSize?:number;
  priority?:'normal'|'low'|'high';
  proportionalLayout?:boolean;
  snap?:boolean;
  visible?:boolean;
}
export interface SplitViewLayout { sizes:number[]; visible:boolean[]; cachedVisibleSizes:(number|undefined)[]; contentSize:number }
export interface SplitViewHandle {
  resizeView(index:number,size:number):void;
  distributeViewSizes():void;
  setViewVisible(index:number,visible:boolean):void;
  getViewSize(index:number):number;
  getViewCachedVisibleSize(index:number):number|undefined;
  getSash(index:number):SashHandle|undefined;
  getLayout():SplitViewLayout;
  setScrollPosition(position:Partial<ScrollPosition>):void;
}
