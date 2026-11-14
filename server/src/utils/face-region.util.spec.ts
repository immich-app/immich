import { describe, expect, it } from 'vitest';
import { ExifOrientation } from 'src/enum.js';
import {
  type FaceBoundingBoxInput,
  isOrientationSidewards,
  toMwgExifToolArgs,
  toMwgRegionInfo,
} from 'src/utils/face-region.util.js';

describe('face-region.util', () => {
  const baseFace: FaceBoundingBoxInput = {
    name: ' John Doe ',
    boundingBoxX1: 100,
    boundingBoxY1: 200,
    boundingBoxX2: 300,
    boundingBoxY2: 400,
    imageWidth: 1000,
    imageHeight: 800,
  };

  it('should return null when faces array is empty', () => {
    expect(toMwgRegionInfo([])).toBeNull();
  });

  it('should identify sidewards orientations correctly', () => {
    expect(isOrientationSidewards(ExifOrientation.Rotate90CW)).toBe(true);
    expect(isOrientationSidewards(ExifOrientation.Rotate270CW)).toBe(true);
    expect(isOrientationSidewards(ExifOrientation.Horizontal)).toBe(false);
  });

  it('should return null when dimensions are missing or zero', () => {
    expect(toMwgRegionInfo([{ ...baseFace, imageWidth: 0, imageHeight: 0 }])).toBeNull();
  });

  it('should calculate normalized center and size for normal orientation (1)', () => {
    const regionInfo = toMwgRegionInfo([baseFace], ExifOrientation.Horizontal);
    expect(regionInfo).not.toBeNull();
    expect(regionInfo?.AppliedToDimensions).toEqual({
      W: 1000,
      H: 800,
      Unit: 'pixel',
    });
    expect(regionInfo?.RegionList).toHaveLength(1);
    expect(regionInfo?.RegionList[0]).toEqual({
      Area: {
        X: 0.2,
        Y: 0.375,
        W: 0.2,
        H: 0.25,
        Unit: 'normalized',
      },
      Type: 'Face',
      Name: 'John Doe',
    });
  });

  it('should handle mirror horizontal orientation (2)', () => {
    const regionInfo = toMwgRegionInfo([baseFace], ExifOrientation.MirrorHorizontal);
    expect(regionInfo?.RegionList[0].Area).toEqual({
      X: 0.8,
      Y: 0.375,
      W: 0.2,
      H: 0.25,
      Unit: 'normalized',
    });
  });

  it('should handle 180 rotation orientation (3)', () => {
    const regionInfo = toMwgRegionInfo([baseFace], ExifOrientation.Rotate180);
    expect(regionInfo?.RegionList[0].Area).toEqual({
      X: 0.8,
      Y: 0.625,
      W: 0.2,
      H: 0.25,
      Unit: 'normalized',
    });
  });

  it('should handle mirror vertical orientation (4)', () => {
    const regionInfo = toMwgRegionInfo([baseFace], ExifOrientation.MirrorVertical);
    expect(regionInfo?.RegionList[0].Area).toEqual({
      X: 0.2,
      Y: 0.625,
      W: 0.2,
      H: 0.25,
      Unit: 'normalized',
    });
  });

  it('should handle 90 CW rotation orientation (6) with swapped dimensions', () => {
    const regionInfo = toMwgRegionInfo([baseFace], ExifOrientation.Rotate90CW);
    expect(regionInfo?.AppliedToDimensions).toEqual({
      W: 800,
      H: 1000,
      Unit: 'pixel',
    });
    expect(regionInfo?.RegionList[0].Area).toEqual({
      X: 0.375,
      Y: 0.8,
      W: 0.25,
      H: 0.2,
      Unit: 'normalized',
    });
  });

  it('should handle 270 CW rotation orientation (8) with swapped dimensions', () => {
    const regionInfo = toMwgRegionInfo([baseFace], ExifOrientation.Rotate270CW);
    expect(regionInfo?.AppliedToDimensions).toEqual({
      W: 800,
      H: 1000,
      Unit: 'pixel',
    });
    expect(regionInfo?.RegionList[0].Area).toEqual({
      X: 0.625,
      Y: 0.2,
      W: 0.25,
      H: 0.2,
      Unit: 'normalized',
    });
  });

  it('should handle mirror horizontal rotate 270 CW (5)', () => {
    const regionInfo = toMwgRegionInfo([baseFace], ExifOrientation.MirrorHorizontalRotate270CW);
    expect(regionInfo?.AppliedToDimensions).toEqual({
      W: 800,
      H: 1000,
      Unit: 'pixel',
    });
    expect(regionInfo?.RegionList[0].Area).toEqual({
      X: 0.375,
      Y: 0.2,
      W: 0.25,
      H: 0.2,
      Unit: 'normalized',
    });
  });

  it('should handle mirror horizontal rotate 90 CW (7)', () => {
    const regionInfo = toMwgRegionInfo([baseFace], ExifOrientation.MirrorHorizontalRotate90CW);
    expect(regionInfo?.AppliedToDimensions).toEqual({
      W: 800,
      H: 1000,
      Unit: 'pixel',
    });
    expect(regionInfo?.RegionList[0].Area).toEqual({
      X: 0.625,
      Y: 0.8,
      W: 0.25,
      H: 0.2,
      Unit: 'normalized',
    });
  });

  it('should clamp out of bounds coordinates', () => {
    const faceOutOfBounds: FaceBoundingBoxInput = {
      name: 'OOB',
      boundingBoxX1: -100,
      boundingBoxY1: -50,
      boundingBoxX2: 1200,
      boundingBoxY2: 900,
      imageWidth: 1000,
      imageHeight: 800,
    };
    const regionInfo = toMwgRegionInfo([faceOutOfBounds]);
    expect(regionInfo?.RegionList[0].Area).toEqual({ X: 0.5, Y: 0.5, W: 1, H: 1, Unit: 'normalized' });
  });

  it.each([
    ExifOrientation.Horizontal,
    ExifOrientation.MirrorHorizontal,
    ExifOrientation.Rotate180,
    ExifOrientation.MirrorVertical,
    ExifOrientation.MirrorHorizontalRotate270CW,
    ExifOrientation.Rotate90CW,
    ExifOrientation.MirrorHorizontalRotate90CW,
    ExifOrientation.Rotate270CW,
  ])('should keep partially out of bounds regions inside the image for orientation %s', (orientation) => {
    const faceOutOfBounds: FaceBoundingBoxInput = {
      name: 'OOB',
      boundingBoxX1: 600,
      boundingBoxY1: -100,
      boundingBoxX2: 1200,
      boundingBoxY2: 300,
      imageWidth: 1000,
      imageHeight: 800,
    };
    const area = toMwgRegionInfo([faceOutOfBounds], orientation)!.RegionList[0].Area;
    const [X, Y, W, H] = [area.X, area.Y, area.W, area.H].map(Number);
    expect(X - W / 2).toBeGreaterThanOrEqual(0);
    expect(X + W / 2).toBeLessThanOrEqual(1);
    expect(Y - H / 2).toBeGreaterThanOrEqual(0);
    expect(Y + H / 2).toBeLessThanOrEqual(1);
  });

  it('should use original image dimensions as-is for sidewards orientations', () => {
    const regionInfo = toMwgRegionInfo([baseFace], ExifOrientation.Rotate90CW, { width: 4000, height: 3200 });
    expect(regionInfo?.AppliedToDimensions).toEqual({ W: 4000, H: 3200, Unit: 'pixel' });
    expect(regionInfo?.RegionList[0].Area).toEqual({ X: 0.375, Y: 0.8, W: 0.25, H: 0.2, Unit: 'normalized' });
  });

  it('should generate valid ExifTool command line arguments', () => {
    const regionInfo = toMwgRegionInfo([baseFace], ExifOrientation.Horizontal)!;
    const args = toMwgExifToolArgs(regionInfo);

    expect(args).toEqual([
      '-overwrite_original',
      '-RegionInfo=',
      '-RegionAppliedToDimensionsW=1000',
      '-RegionAppliedToDimensionsH=800',
      '-RegionAppliedToDimensionsUnit=pixel',
      '-RegionAreaX+=0.2',
      '-RegionAreaY+=0.375',
      '-RegionAreaW+=0.2',
      '-RegionAreaH+=0.25',
      '-RegionAreaUnit+=normalized',
      '-RegionType+=Face',
      '-RegionName+=John Doe',
    ]);
  });
});
