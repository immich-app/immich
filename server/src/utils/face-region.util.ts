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

export const toMwgRegionInfo = (
  faces: FaceBoundingBoxInput[],
  orientation?: ExifOrientation | number,
  dimensions?: { width: number; height: number },
): RegionInfo | null => {
  if (faces.length === 0) {
    return null;
  }

  const baseWidth = dimensions?.width || faces[0].imageWidth;
  const baseHeight = dimensions?.height || faces[0].imageHeight;

  if (!baseWidth || !baseHeight) {
    return null;
  }

  const isSidewards = Boolean(orientation && isOrientationSidewards(orientation));

  const appliedW = isSidewards ? baseHeight : baseWidth;
  const appliedH = isSidewards ? baseWidth : baseHeight;

  const regionList: RegionItem[] = faces.map((face) => {
    const faceW = face.imageWidth || baseWidth;
    const faceH = face.imageHeight || baseHeight;

    const x1 = face.boundingBoxX1;
    const y1 = face.boundingBoxY1;
    const x2 = face.boundingBoxX2;
    const y2 = face.boundingBoxY2;

    let cx = (x1 + x2) / 2 / faceW;
    let cy = (y1 + y2) / 2 / faceH;
    let w = Math.abs(x2 - x1) / faceW;
    let h = Math.abs(y2 - y1) / faceH;

    if (orientation !== undefined && orientation !== ExifOrientation.Horizontal) {
      switch (orientation) {
        case ExifOrientation.MirrorHorizontal: {
          cx = 1 - cx;
          break;
        }
        case ExifOrientation.Rotate180: {
          [cx, cy] = [1 - cx, 1 - cy];
          break;
        }
        case ExifOrientation.MirrorVertical: {
          cy = 1 - cy;
          break;
        }
        case ExifOrientation.MirrorHorizontalRotate270CW: {
          [cx, cy] = [cy, cx];
          break;
        }
        case ExifOrientation.Rotate90CW: {
          [cx, cy] = [cy, 1 - cx];
          break;
        }
        case ExifOrientation.MirrorHorizontalRotate90CW: {
          [cx, cy] = [1 - cy, 1 - cx];
          break;
        }
        case ExifOrientation.Rotate270CW: {
          [cx, cy] = [1 - cy, cx];
          break;
        }
      }

      if (isSidewards) {
        [w, h] = [h, w];
      }
    }

    cx = Math.max(0, Math.min(1, Number(cx.toFixed(5))));
    cy = Math.max(0, Math.min(1, Number(cy.toFixed(5))));
    w = Math.max(0, Math.min(1, Number(w.toFixed(5))));
    h = Math.max(0, Math.min(1, Number(h.toFixed(5))));

    return {
      Area: {
        X: cx,
        Y: cy,
        W: w,
        H: h,
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

export const toMwgExifToolArgs = (regionInfo: RegionInfo): string[] => {
  const args = [
    '-overwrite_original',
    '-RegionInfo=',
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
