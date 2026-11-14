import type { ImmichTags } from 'src/repositories/metadata.repository.js';
import { ExifOrientation } from 'src/enum.js';

export interface FaceBoundingBoxInput {
  boundingBoxX1: number;
  boundingBoxY1: number;
  boundingBoxX2: number;
  boundingBoxY2: number;
  imageWidth: number;
  imageHeight: number;
  name: string;
}

export type RegionInfo = NonNullable<ImmichTags['RegionInfo']>;
export type RegionItem = RegionInfo['RegionList'][number];

export const isOrientationSidewards = (orientation: ExifOrientation | number): boolean => {
  return [
    ExifOrientation.MirrorHorizontalRotate270CW,
    ExifOrientation.Rotate90CW,
    ExifOrientation.MirrorHorizontalRotate90CW,
    ExifOrientation.Rotate270CW,
  ].includes(orientation);
};

const clampUnit = (value: number) => Math.max(0, Math.min(1, value));

const roundTo = (value: number, digits: number) => Number(value.toFixed(digits));

const toStoredOrientation = (x: number, y: number, orientation?: ExifOrientation | number): [number, number] => {
  switch (orientation) {
    case ExifOrientation.MirrorHorizontal: {
      return [1 - x, y];
    }
    case ExifOrientation.Rotate180: {
      return [1 - x, 1 - y];
    }
    case ExifOrientation.MirrorVertical: {
      return [x, 1 - y];
    }
    case ExifOrientation.MirrorHorizontalRotate270CW: {
      return [y, x];
    }
    case ExifOrientation.Rotate90CW: {
      return [y, 1 - x];
    }
    case ExifOrientation.MirrorHorizontalRotate90CW: {
      return [1 - y, 1 - x];
    }
    case ExifOrientation.Rotate270CW: {
      return [1 - y, x];
    }
    default: {
      return [x, y];
    }
  }
};

const toCenterAndSize = (a: number, b: number) => {
  const start = roundTo(Math.min(a, b), 5);
  const end = roundTo(Math.max(a, b), 5);
  return { center: roundTo((start + end) / 2, 6), size: roundTo(end - start, 5) };
};

export const toMwgRegionInfo = (
  faces: FaceBoundingBoxInput[],
  orientation?: ExifOrientation | number,
  dimensions?: { width: number; height: number },
): RegionInfo | null => {
  if (faces.length === 0) {
    return null;
  }

  const isSidewards = orientation !== undefined && isOrientationSidewards(orientation);
  const displayWidth = faces[0].imageWidth;
  const displayHeight = faces[0].imageHeight;
  const fallbackDimensions = isSidewards
    ? { width: displayHeight, height: displayWidth }
    : { width: displayWidth, height: displayHeight };
  const { width: appliedW, height: appliedH } =
    dimensions?.width && dimensions.height ? dimensions : fallbackDimensions;

  if (!appliedW || !appliedH || !displayWidth || !displayHeight) {
    return null;
  }

  const regionList: RegionItem[] = faces.map((face) => {
    const faceW = face.imageWidth || displayWidth;
    const faceH = face.imageHeight || displayHeight;

    const left = clampUnit(Math.min(face.boundingBoxX1, face.boundingBoxX2) / faceW);
    const right = clampUnit(Math.max(face.boundingBoxX1, face.boundingBoxX2) / faceW);
    const top = clampUnit(Math.min(face.boundingBoxY1, face.boundingBoxY2) / faceH);
    const bottom = clampUnit(Math.max(face.boundingBoxY1, face.boundingBoxY2) / faceH);

    const [ax, ay] = toStoredOrientation(left, top, orientation);
    const [bx, by] = toStoredOrientation(right, bottom, orientation);
    const horizontal = toCenterAndSize(ax, bx);
    const vertical = toCenterAndSize(ay, by);

    return {
      Area: {
        X: horizontal.center,
        Y: vertical.center,
        W: horizontal.size,
        H: vertical.size,
        Unit: 'normalized',
      },
      Type: 'Face',
      Name: face.name.trim(),
    };
  });

  return {
    AppliedToDimensions: {
      W: appliedW,
      H: appliedH,
      Unit: 'pixel',
    },
    RegionList: regionList,
  };
};

export const clearMwgRegionsExifToolArgs = (): string[] => ['-overwrite_original', '-RegionInfo='];

export const toMwgExifToolArgs = (regionInfo: RegionInfo): string[] => {
  const args = [
    ...clearMwgRegionsExifToolArgs(),
    `-RegionAppliedToDimensionsW=${regionInfo.AppliedToDimensions.W}`,
    `-RegionAppliedToDimensionsH=${regionInfo.AppliedToDimensions.H}`,
    `-RegionAppliedToDimensionsUnit=${regionInfo.AppliedToDimensions.Unit || 'pixel'}`,
  ];

  for (const region of regionInfo.RegionList) {
    args.push(
      `-RegionAreaX+=${region.Area.X}`,
      `-RegionAreaY+=${region.Area.Y}`,
      `-RegionAreaW+=${region.Area.W}`,
      `-RegionAreaH+=${region.Area.H}`,
      `-RegionAreaUnit+=${region.Area.Unit || 'normalized'}`,
      `-RegionType+=${region.Type || 'Face'}`,
      `-RegionName+=${region.Name}`,
    );
  }

  return args;
};
