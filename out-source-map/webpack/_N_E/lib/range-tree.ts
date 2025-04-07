/**
 * A range is a tuple of two numbers that represent the start and end (exclusive) of a range.
 */
type Range = [number, number];

/**
 * TODO: Is this even going to be used?
 * A specialized binary tree of ranges that does not allow for the overlapping of ranges.
 */
export class NonOverlappingRangeTree {
  private range: Range;
  private left?: NonOverlappingRangeTree;
  private right?: NonOverlappingRangeTree;

  constructor(range: Range) {
    this.range = range;
  }

  isNumberInAnyRange(num: number): boolean {
    if (this.range[0] <= num && num < this.range[1]) {
      return true;
    }
    if (this.left && this.left.isNumberInAnyRange(num)) {
      return true;
    }
    if (this.right && this.right.isNumberInAnyRange(num)) {
      return true;
    }
    return false;
  }

  overlapsWithAny(range: Range): boolean {
    return (
      (this.left && this.left.overlapsWithAny(range)) ||
      (this.right && this.right.overlapsWithAny(range)) ||
      (this.range[0] < range[1] && this.range[1] > range[0])
    );
  }

  addRange(range: Range): void {
    if (range[0] >= this.range[1]) {
      if (this.right) {
        this.right.addRange(range);
      } else {
        this.right = new NonOverlappingRangeTree(range);
      }
    } else if (range[1] <= this.range[0]) {
      if (this.left) {
        this.left.addRange(range);
      } else {
        this.left = new NonOverlappingRangeTree(range);
      }
    } else {
      throw new Error('Ranges cannot overlap');
    }
  }
}

/**
 * A specialized list of ranges, for the purposes of calculating moves.
 */
export class MoveRangeList {
  //A sorted list of ranges. Ranges can overlap, but cannot be entirely contained within another range.
  private ranges: Range[] = [];

  hasRangesWrapping(range: Range): boolean {
    // use binary search to find the first range that starts after the given range
    let left = 0;
    let right = this.ranges.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const thisRange = this.ranges[mid];

      if (thisRange[0] <= range[0]) {
        if (thisRange[1] >= range[1]) {
          // found a range that overlaps it.
          return true;
        }
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return false;
  }

  // insert the range in the correct position.
  insertRange(range: Range): void {
    this.ranges.splice(this.findClosestRangeBefore(range), 0, range);
  }

  replaceRangesWrappedBy(range: Range): void {
    // for (let i = this.findClosestRangeBefore(range); this.ranges[i] && this.ranges[i][1] <= range[1]; i++) {
    //   this.ranges.splice(i, 1);
    // }
    let rangeIndex = this.findClosestRangeBefore(range);
    const removeStart = rangeIndex;
    while (this.ranges[rangeIndex] && this.ranges[rangeIndex][1] <= range[1]) {
      rangeIndex++;
    }
    this.ranges.splice(removeStart, rangeIndex - removeStart, range);
  }

  getAllRanges(): Range[] {
    return this.ranges;
  }

  private findClosestRangeBefore(range: Range): number {
    let left = 0;
    let right = this.ranges.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const thisRange = this.ranges[mid];

      if (thisRange[0] <= range[0]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return left;
  }
}
