/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Normalize pixel, line and legacy wheel events consistently across browsers.
const browser = {
  isChrome: navigator.userAgent.includes('Chrome'),
  isFirefox: navigator.userAgent.includes('Firefox'),
  isSafari:
    navigator.userAgent.includes('Safari') &&
    !navigator.userAgent.includes('Chrome'),
};
const platform = {
  isMacintosh: navigator.platform.includes('Mac'),
  isWindows: navigator.platform.includes('Win'),
};
export interface IMouseWheelEvent extends MouseEvent {
  readonly wheelDelta: number;
  readonly wheelDeltaX: number;
  readonly wheelDeltaY: number;

  readonly deltaX: number;
  readonly deltaY: number;
  readonly deltaZ: number;
  readonly deltaMode: number;
}

interface IWebKitMouseWheelEvent {
  wheelDeltaY: number;
  wheelDeltaX: number;
}

interface IGeckoMouseWheelEvent {
  HORIZONTAL_AXIS: number;
  VERTICAL_AXIS: number;
  axis: number;
  detail: number;
}

export class StandardWheelEvent {
  public readonly browserEvent: IMouseWheelEvent | null;
  public readonly deltaY: number;
  public readonly deltaX: number;
  public readonly target: Node | null;

  constructor(
    e: IMouseWheelEvent | null,
    deltaX: number = 0,
    deltaY: number = 0,
  ) {
    this.browserEvent = e || null;
    // eslint-disable-next-line local/code-no-any-casts
    this.target = e ? e.target || (<any>e).targetNode || e.srcElement : null;

    this.deltaY = deltaY;
    this.deltaX = deltaX;

    let shouldFactorDPR: boolean = false;
    if (browser.isChrome) {
      // Chrome version >= 123 contains the fix to factor devicePixelRatio into the wheel event.
      // See https://chromium.googlesource.com/chromium/src.git/+/be51b448441ff0c9d1f17e0f25c4bf1ab3f11f61
      const chromeVersionMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
      const chromeMajorVersion = chromeVersionMatch
        ? parseInt(chromeVersionMatch[1])
        : 123;
      shouldFactorDPR = chromeMajorVersion <= 122;
    }

    if (e) {
      // Old (deprecated) wheel events
      // eslint-disable-next-line local/code-no-any-casts
      const e1 = <IWebKitMouseWheelEvent>(<any>e);
      // eslint-disable-next-line local/code-no-any-casts
      const e2 = <IGeckoMouseWheelEvent>(<any>e);
      const devicePixelRatio = e.view?.devicePixelRatio || 1;

      // vertical delta scroll
      if (typeof e1.wheelDeltaY !== 'undefined') {
        if (shouldFactorDPR) {
          // Refs https://github.com/microsoft/vscode/issues/146403#issuecomment-1854538928
          this.deltaY = e1.wheelDeltaY / (120 * devicePixelRatio);
        } else {
          this.deltaY = e1.wheelDeltaY / 120;
        }
      } else if (
        typeof e2.VERTICAL_AXIS !== 'undefined' &&
        e2.axis === e2.VERTICAL_AXIS
      ) {
        this.deltaY = -e2.detail / 3;
      } else if (e.type === 'wheel') {
        // Modern wheel event
        // https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent
        const ev = <WheelEvent>(<unknown>e);

        if (ev.deltaMode === ev.DOM_DELTA_LINE) {
          // the deltas are expressed in lines
          if (browser.isFirefox && !platform.isMacintosh) {
            this.deltaY = -e.deltaY / 3;
          } else {
            this.deltaY = -e.deltaY;
          }
        } else {
          this.deltaY = -e.deltaY / 40;
        }
      }

      // horizontal delta scroll
      if (typeof e1.wheelDeltaX !== 'undefined') {
        if (browser.isSafari && platform.isWindows) {
          this.deltaX = -(e1.wheelDeltaX / 120);
        } else if (shouldFactorDPR) {
          // Refs https://github.com/microsoft/vscode/issues/146403#issuecomment-1854538928
          this.deltaX = e1.wheelDeltaX / (120 * devicePixelRatio);
        } else {
          this.deltaX = e1.wheelDeltaX / 120;
        }
      } else if (
        typeof e2.HORIZONTAL_AXIS !== 'undefined' &&
        e2.axis === e2.HORIZONTAL_AXIS
      ) {
        this.deltaX = -e.detail / 3;
      } else if (e.type === 'wheel') {
        // Modern wheel event
        // https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent
        const ev = <WheelEvent>(<unknown>e);

        if (ev.deltaMode === ev.DOM_DELTA_LINE) {
          // the deltas are expressed in lines
          if (browser.isFirefox && !platform.isMacintosh) {
            this.deltaX = -e.deltaX / 3;
          } else {
            this.deltaX = -e.deltaX;
          }
        } else {
          this.deltaX = -e.deltaX / 40;
        }
      }

      // Assume a vertical scroll if nothing else worked
      if (this.deltaY === 0 && this.deltaX === 0 && e.wheelDelta) {
        if (shouldFactorDPR) {
          // Refs https://github.com/microsoft/vscode/issues/146403#issuecomment-1854538928
          this.deltaY = e.wheelDelta / (120 * devicePixelRatio);
        } else {
          this.deltaY = e.wheelDelta / 120;
        }
      }
    }
  }

  public preventDefault(): void {
    this.browserEvent?.preventDefault();
  }

  public stopPropagation(): void {
    this.browserEvent?.stopPropagation();
  }
}
