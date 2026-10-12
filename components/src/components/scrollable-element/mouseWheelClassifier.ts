/* Copyright (c) Microsoft Corporation. Licensed under the MIT License. */
class MouseWheelClassifierItem {
  public timestamp: number;
  public deltaX: number;
  public deltaY: number;
  public score: number;

  constructor(timestamp: number, deltaX: number, deltaY: number) {
    this.timestamp = timestamp;
    this.deltaX = deltaX;
    this.deltaY = deltaY;
    this.score = 0;
  }
}

export class MouseWheelClassifier {
  public static readonly INSTANCE = new MouseWheelClassifier();

  private readonly _capacity: number;
  private _memory: MouseWheelClassifierItem[];
  private _front: number;
  private _rear: number;

  constructor() {
    this._capacity = 5;
    this._memory = [];
    this._front = -1;
    this._rear = -1;
  }

  public isPhysicalMouseWheel(): boolean {
    if (this._front === -1 && this._rear === -1) {
      // no elements
      return false;
    }

    // 0.5 * last + 0.25 * 2nd last + 0.125 * 3rd last + ...
    let remainingInfluence = 1;
    let score = 0;
    let iteration = 1;

    let index = this._rear;
    do {
      const influence =
        index === this._front ? remainingInfluence : Math.pow(2, -iteration);
      remainingInfluence -= influence;
      score += this._memory[index].score * influence;

      if (index === this._front) {
        break;
      }

      index = (this._capacity + index - 1) % this._capacity;
      iteration++;
    } while (true);

    return score <= 0.5;
  }

  public accept(timestamp: number, deltaX: number, deltaY: number): void {
    let previousItem = null;
    const item = new MouseWheelClassifierItem(timestamp, deltaX, deltaY);

    if (this._front === -1 && this._rear === -1) {
      this._memory[0] = item;
      this._front = 0;
      this._rear = 0;
    } else {
      previousItem = this._memory[this._rear];

      this._rear = (this._rear + 1) % this._capacity;
      if (this._rear === this._front) {
        // Drop oldest
        this._front = (this._front + 1) % this._capacity;
      }
      this._memory[this._rear] = item;
    }

    item.score = this._computeScore(item, previousItem);
  }

  /**
   * A score between 0 and 1 for `item`.
   *  - a score towards 0 indicates that the source appears to be a physical mouse wheel
   *  - a score towards 1 indicates that the source appears to be a touchpad or magic mouse, etc.
   */
  private _computeScore(
    item: MouseWheelClassifierItem,
    previousItem: MouseWheelClassifierItem | null,
  ): number {
    if (Math.abs(item.deltaX) > 0 && Math.abs(item.deltaY) > 0) {
      // both axes exercised => definitely not a physical mouse wheel
      return 1;
    }

    let score: number = 0.5;

    if (!this._isAlmostInt(item.deltaX) || !this._isAlmostInt(item.deltaY)) {
      // non-integer deltas => indicator that this is not a physical mouse wheel
      score += 0.25;
    }

    // Non-accelerating scroll => indicator that this is a physical mouse wheel
    // These can be identified by seeing whether they are the module of one another.
    if (previousItem) {
      const absDeltaX = Math.abs(item.deltaX);
      const absDeltaY = Math.abs(item.deltaY);

      const absPreviousDeltaX = Math.abs(previousItem.deltaX);
      const absPreviousDeltaY = Math.abs(previousItem.deltaY);

      // Min 1 to avoid division by zero, module 1 will still be 0.
      const minDeltaX = Math.max(Math.min(absDeltaX, absPreviousDeltaX), 1);
      const minDeltaY = Math.max(Math.min(absDeltaY, absPreviousDeltaY), 1);

      const maxDeltaX = Math.max(absDeltaX, absPreviousDeltaX);
      const maxDeltaY = Math.max(absDeltaY, absPreviousDeltaY);

      const isSameModulo =
        maxDeltaX % minDeltaX === 0 && maxDeltaY % minDeltaY === 0;
      if (isSameModulo) {
        score -= 0.5;
      }
    }

    return Math.min(Math.max(score, 0), 1);
  }

  private _isAlmostInt(value: number): boolean {
    const epsilon = Number.EPSILON * 100; // Use a small tolerance factor for floating-point errors
    const delta = Math.abs(Math.round(value) - value);
    return delta < 0.01 + epsilon;
  }
}
