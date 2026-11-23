import { SyncRequestType } from 'src/enum.js';
import { SYNC_TYPES_ORDER } from 'src/services/sync.service.js';

describe('types', () => {
  it('should have all the types in the ordering variable', () => {
    for (const key in SyncRequestType) {
      expect(SYNC_TYPES_ORDER.includes(key as SyncRequestType)).toBe(true);
    }

    expect(SYNC_TYPES_ORDER.length).toBe(Object.keys(SyncRequestType).length);
  });

  it('should ensure album follows albums assets', () => {
    const albumIndex = SYNC_TYPES_ORDER.indexOf(SyncRequestType.AlbumsV2);
    const albumAssetsIndex = SYNC_TYPES_ORDER.indexOf(SyncRequestType.AlbumAssetsV2);

    expect(albumIndex).toBeGreaterThan(albumAssetsIndex);
  });
});
