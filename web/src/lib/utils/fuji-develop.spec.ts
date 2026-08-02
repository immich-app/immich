import { assetFactory } from '@test-data/factories/asset-factory';
import {
  createFujiDevelopParameters,
  defaultFujiDevelopSettings,
  FUJI_DEVELOP_ACTION,
  FUJI_DEVELOP_PROCESS_MODEL,
  isFujiDevelopParameters,
  isFujiXt5RawAsset,
  mergeFujiDevelopEdit,
  type StoredAssetEdit,
} from './fuji-develop';

describe('Fuji RAW development utilities', () => {
  it('validates the versioned renderer parameter contract', () => {
    const parameters = createFujiDevelopParameters('nostalgic-neg', defaultFujiDevelopSettings());

    expect(isFujiDevelopParameters(parameters)).toBe(true);
    expect(isFujiDevelopParameters({ ...parameters, processModel: 'future-model' })).toBe(false);
    expect(isFujiDevelopParameters({ ...parameters, exposure: 5.01 })).toBe(false);
  });

  it('replaces only Fuji development while preserving native edits with crop first', () => {
    const oldParameters = createFujiDevelopParameters('provia-standard', defaultFujiDevelopSettings());
    const newParameters = createFujiDevelopParameters('nostalgic-neg', {
      ...defaultFujiDevelopSettings(),
      highlights: -42,
    });
    const edits: StoredAssetEdit[] = [
      { id: 'rotate-id', action: 'rotate', parameters: { angle: 90 } },
      { id: 'old-fuji-id', action: FUJI_DEVELOP_ACTION, parameters: oldParameters },
      { id: 'crop-id', action: 'crop', parameters: { x: 0.1, y: 0.2, width: 0.7, height: 0.6 } },
      { id: 'mirror-id', action: 'mirror', parameters: { axis: 'horizontal' } },
    ];

    const merged = mergeFujiDevelopEdit(edits, newParameters);

    expect(merged.map(({ action }) => action)).toEqual(['crop', 'rotate', 'mirror', FUJI_DEVELOP_ACTION]);
    expect(merged.at(-1)?.parameters).toEqual(newParameters);
    expect(merged.every((edit) => edit.id === undefined)).toBe(true);
  });

  it('identifies Fujifilm X-T5 RAF assets', () => {
    const asset = assetFactory.build({
      originalFileName: 'DXT51946.RAF',
      originalPath: '/photos/DXT51946.RAF',
      isOffline: false,
      exifInfo: { make: 'FUJIFILM', model: 'X-T5' },
    });

    expect(isFujiXt5RawAsset(asset)).toBe(true);
    expect(isFujiXt5RawAsset({ ...asset, originalFileName: 'DXT51946.JPG', originalPath: '/photos/DXT51946.JPG' })).toBe(
      false,
    );
    expect(isFujiXt5RawAsset({ ...asset, exifInfo: { ...asset.exifInfo, model: 'X-T4' } })).toBe(false);
    expect(FUJI_DEVELOP_PROCESS_MODEL).toBe('lightroom-pv2012-independent-v6');
  });
});
