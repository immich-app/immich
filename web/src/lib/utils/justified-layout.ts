export interface LayoutOptions {
  rowHeight: number;
  rowWidth: number;
  spacing: number;
  heightTolerance: number;
}

export class JustifiedLayout {
  layout: number[];

  constructor(aspectRatios: number[], options: LayoutOptions) {
    this.layout = aspectRatios.length === 0 ? [0, 0, 0, 0] : getJustifiedLayout(aspectRatios, options);
  }

  get containerWidth() {
    return this.layout[0];
  }

  get containerHeight() {
    return this.layout[1];
  }

  getTop(boxIdx: number) {
    return this.layout[boxIdx * 4 + 4]; // the first 4 elements are containerWidth, containerHeight, padding, padding
  }

  getLeft(boxIdx: number) {
    return this.layout[boxIdx * 4 + 5];
  }

  getWidth(boxIdx: number) {
    return this.layout[boxIdx * 4 + 6];
  }

  getHeight(boxIdx: number) {
    return this.layout[boxIdx * 4 + 7];
  }

  getPosition(boxIdx: number) {
    return {
      top: this.layout[boxIdx * 4 + 4],
      left: this.layout[boxIdx * 4 + 5],
      width: this.layout[boxIdx * 4 + 6],
      height: this.layout[boxIdx * 4 + 7],
    };
  }
}

function getJustifiedLayout(aspectRatios: number[], options: LayoutOptions) {
  if (aspectRatios.length === 0) return [];

  const positions: number[] = Array.from({ length: aspectRatios.length * 4 + 4 });
  const minRowHeight = Math.max(options.rowHeight * (1 - options.heightTolerance), 0);
  const maxRowHeight = options.rowHeight * (1 + options.heightTolerance);
  let curAspectRatio = 0;
  let rowAspectRatio = 0;
  let maxActualRowWidth = 0;
  let rowStartIdx = 0;
  let top = 0;
  const maxRowAspectRatio = options.rowWidth / minRowHeight;
  const targetRowAspectRatio = options.rowWidth / options.rowHeight;
  const spacingAspectRatio = options.spacing / options.rowHeight;

  let rowDiff = targetRowAspectRatio;
  for (let i = 0; i < aspectRatios.length; i++) {
    const aspectRatio = aspectRatios[i];
    curAspectRatio += aspectRatio;
    const curDiff = Math.abs(curAspectRatio - targetRowAspectRatio);

    // there are no more boxes that can fit in this row
    if ((curAspectRatio > maxRowAspectRatio || curDiff > rowDiff) && i > rowStartIdx) {
      const aspectRatioRow = aspectRatios.slice(rowStartIdx, i);

      // treat the row's boxes as a single entity and scale them to fit the row width
      const totalAspectRatio = rowAspectRatio - spacingAspectRatio * aspectRatioRow.length;
      const spacingPixels = options.spacing * (aspectRatioRow.length - 1);
      const scaledRowHeight = Math.min((options.rowWidth - spacingPixels) / totalAspectRatio, maxRowHeight);

      let actualRowWidth = spacingPixels;
      let left = 0;

      // eslint-disable-next-line unicorn/no-for-loop
      for (let j = 0; j < aspectRatioRow.length; j++) {
        const width = aspectRatioRow[j] * scaledRowHeight;
        const posIndex = (rowStartIdx + j) * 4 + 4;
        positions[posIndex + 0] = top;
        positions[posIndex + 1] = left;
        positions[posIndex + 2] = width;
        positions[posIndex + 3] = scaledRowHeight;
        left += width + options.spacing;
        actualRowWidth += width;
      }
      top += scaledRowHeight + options.spacing;
      maxActualRowWidth = Math.max(actualRowWidth, maxActualRowWidth);
      rowStartIdx = i;
      curAspectRatio = aspectRatio;
      rowDiff = Math.abs(curAspectRatio - targetRowAspectRatio);
    } else {
      rowDiff = curDiff;
    }
    curAspectRatio += spacingAspectRatio;
    rowAspectRatio = curAspectRatio;
  }

  // this is the same as in the for loop and processes the last row
  // inlined because it ends up producing much better assembly
  const aspectRatioRow = aspectRatios.slice(rowStartIdx);
  const totalAspectRatio = rowAspectRatio - spacingAspectRatio * aspectRatioRow.length;
  const spacingPixels = options.spacing * (aspectRatioRow.length - 1);
  const baseRowHeight = (options.rowWidth - spacingPixels) / totalAspectRatio;
  const scaledRowHeight =
    baseRowHeight > maxRowHeight
      ? rowStartIdx > 0
        ? Math.min(baseRowHeight, positions[rowStartIdx * 4 + 3])
        : Math.min(baseRowHeight, maxRowHeight)
      : baseRowHeight;

  let actualRowWidth = spacingPixels;
  let left = 0;

  // eslint-disable-next-line unicorn/no-for-loop
  for (let j = 0; j < aspectRatioRow.length; j++) {
    const width = aspectRatioRow[j] * scaledRowHeight;
    const posIndex = (rowStartIdx + j) * 4 + 4;
    positions[posIndex + 0] = top;
    positions[posIndex + 1] = left;
    positions[posIndex + 2] = width;
    positions[posIndex + 3] = scaledRowHeight;
    left += width + options.spacing;
    actualRowWidth += width;
  }

  // SAFETY: these indices are guaranteed to be within the vector's bounds
  positions[0] = Math.max(actualRowWidth, maxActualRowWidth);
  positions[1] = top + scaledRowHeight;

  return positions;
}
