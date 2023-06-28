import { validMimeTypes } from './domain.constant';

describe('valid mime types', () => {
  it('should be a sorted list', () => {
    expect(validMimeTypes).toEqual(validMimeTypes.sort());
  });

  it('should contain only unique values', () => {
    expect(validMimeTypes).toEqual([...new Set(validMimeTypes)]);
  });

  it('should contain only image or video mime types', () => {
    expect(validMimeTypes).toEqual(
      validMimeTypes.filter((mimeType) => mimeType.startsWith('image/') || mimeType.startsWith('video/')),
    );
  });

  it('should contain only lowercase mime types', () => {
    expect(validMimeTypes).toEqual(validMimeTypes.map((mimeType) => mimeType.toLowerCase()));
  });
});
