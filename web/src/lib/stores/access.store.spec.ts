import { hasAccess } from '$lib/stores/access.store';
import { albumFactory } from '@test-data/factories/album-factory';
import { assetFactory } from '@test-data/factories/asset-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { userAdminFactory, userFactory } from '@test-data/factories/user-factory';
import { describe, it } from 'vitest';

const user = userAdminFactory.build({ id: 'user-id' });

describe('AccessStore', () => {
  describe('hasAccess', () => {
    describe('asset.share', () => {
      const access = 'asset.share';

      it('should return true for owned assets', () => {
        const asset = assetFactory.build({ ownerId: user.id });
        expect(hasAccess({ access, asset }, { user })).toBe(true);
      });

      it('should return false for not owned assets', () => {
        const asset = assetFactory.build({ isOffline: false });
        expect(hasAccess({ access, asset }, { user })).toBe(false);
      });

      it('should return false for trashed assets', () => {
        const asset = assetFactory.build({ ownerId: user.id, isTrashed: true });
        expect(hasAccess({ access, asset }, { user })).toBe(true);
      });
    });

    describe('asset.download', () => {
      const access = 'asset.download';

      it('should return true for owned assets', () => {
        const asset = assetFactory.build({ ownerId: user.id, isOffline: false });
        expect(hasAccess({ access, asset }, { user })).toBe(true);
      });

      it('should return false for not owned assets', () => {
        const asset = assetFactory.build({ isOffline: false });
        expect(hasAccess({ access, asset }, { user })).toBe(false);
      });

      it('should return true for partner sharing', () => {
        const asset = assetFactory.build({ ownerId: user.id, isOffline: false });
        const partner = userFactory.build();
        expect(hasAccess({ access, asset }, { user, partners: [partner] })).toBe(true);
      });

      it('should return false for shared links', () => {
        const asset = assetFactory.build({ isOffline: false });
        const sharedLink = sharedLinkFactory.build({ allowDownload: false });
        expect(hasAccess({ access, asset }, { sharedLink })).toBe(false);
      });

      it('should return true for shared links with download enabled', () => {
        const asset = assetFactory.build({ isOffline: false });
        const sharedLink = sharedLinkFactory.build({ allowDownload: true });
        expect(hasAccess({ access, asset }, { sharedLink })).toBe(true);
      });
    });

    describe('asset.unstack', () => {
      const access = 'asset.unstack';

      it('should return true for owned assets', () => {
        const asset = assetFactory.build({ ownerId: user.id });
        expect(hasAccess({ access, asset }, { user })).toBe(true);
      });

      it('should return false for non owned assets', () => {
        const asset = assetFactory.build();
        expect(hasAccess({ access, asset }, { user })).toBe(false);
      });

      it('should return false for partner sharing', () => {
        const partner = userFactory.build({ id: 'partner-id' });
        const asset = assetFactory.build({ ownerId: partner.id });
        expect(hasAccess({ access, asset }, { user, partners: [partner] })).toBe(false);
      });
    });

    describe('asset.favorite', () => {
      const access = 'asset.favorite';

      it('should return true for owned assets', () => {
        const asset = assetFactory.build({ ownerId: user.id });
        expect(hasAccess({ access, asset }, { user })).toBe(true);
      });

      it('should return false for non owned assets', () => {
        const asset = assetFactory.build();
        expect(hasAccess({ access, asset }, { user })).toBe(false);
      });

      it('should return false for partner sharing', () => {
        const partner = userFactory.build({ id: 'partner-id' });
        const asset = assetFactory.build({ ownerId: partner.id });
        expect(hasAccess({ access, asset }, { user, partners: [partner] })).toBe(false);
      });
    });

    describe('album.update', () => {
      const access = 'album.update';

      it('should return true for owned albums', () => {
        const album = albumFactory.build({ ownerId: user.id });
        expect(hasAccess({ access, album }, { user })).toBe(true);
      });
    });
  });
});
