import { assetUtils } from './asset-utils';

describe('Asset Utilities', () => {
  describe('isWebPlayable', () => {
    it('Check that it returns true with mimetype webm', () => {
      const result = assetUtils.isWebPlayable('video/webm');
      expect(result).toBeTruthy();
    });

    it('Check that returns true with mimetype mp4', () => {
      const result = assetUtils.isWebPlayable('video/mp4');
      expect(result).toBeTruthy();
    });

    it('Check that returns false with mimetype quicktime', () => {
      const result = assetUtils.isWebPlayable('video/quicktime');
      expect(result).toBeFalsy();
    });
  });
});
