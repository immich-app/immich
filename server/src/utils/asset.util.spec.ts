import { getDimensions, isPanorama } from 'src/utils/asset.util';

describe('getDimensions', () => {
  it('should return 0x0 when width is null', () => {
    expect(getDimensions({ exifImageWidth: null, exifImageHeight: 100, orientation: null })).toEqual({
      width: 0,
      height: 0,
    });
  });

  it('should return 0x0 when height is null', () => {
    expect(getDimensions({ exifImageWidth: 100, exifImageHeight: null, orientation: null })).toEqual({
      width: 0,
      height: 0,
    });
  });

  it('should return original dimensions when orientation is not flipped', () => {
    expect(getDimensions({ exifImageWidth: 1920, exifImageHeight: 1080, orientation: '1' })).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it('should swap dimensions when orientation is 5', () => {
    expect(getDimensions({ exifImageWidth: 1920, exifImageHeight: 1080, orientation: '5' })).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it('should swap dimensions when orientation is 6', () => {
    expect(getDimensions({ exifImageWidth: 1920, exifImageHeight: 1080, orientation: '6' })).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it('should swap dimensions when orientation is 7', () => {
    expect(getDimensions({ exifImageWidth: 1920, exifImageHeight: 1080, orientation: '7' })).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it('should swap dimensions when orientation is 8', () => {
    expect(getDimensions({ exifImageWidth: 1920, exifImageHeight: 1080, orientation: '8' })).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it('should swap dimensions when orientation is -90', () => {
    expect(getDimensions({ exifImageWidth: 1920, exifImageHeight: 1080, orientation: '-90' })).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it('should swap dimensions when orientation is 90', () => {
    expect(getDimensions({ exifImageWidth: 1920, exifImageHeight: 1080, orientation: '90' })).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it('should return original dimensions when orientation is null', () => {
    expect(getDimensions({ exifImageWidth: 1920, exifImageHeight: 1080, orientation: null })).toEqual({
      width: 1920,
      height: 1080,
    });
  });
});

describe('isPanorama', () => {
  it('should return true for EQUIRECTANGULAR projection', () => {
    expect(isPanorama({ projectionType: 'EQUIRECTANGULAR', originalFileName: 'photo.jpg' })).toBe(true);
  });

  it('should return true for .insp files', () => {
    expect(isPanorama({ projectionType: null, originalFileName: 'photo.INSP' })).toBe(true);
  });

  it('should return true for .insp files (lowercase)', () => {
    expect(isPanorama({ projectionType: null, originalFileName: 'photo.insp' })).toBe(true);
  });

  it('should return false for regular photos', () => {
    expect(isPanorama({ projectionType: null, originalFileName: 'photo.jpg' })).toBe(false);
  });

  it('should return false for non-equirectangular projection', () => {
    expect(isPanorama({ projectionType: 'FLAT', originalFileName: 'photo.jpg' })).toBe(false);
  });
});
