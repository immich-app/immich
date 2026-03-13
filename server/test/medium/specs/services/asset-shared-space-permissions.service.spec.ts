import { Kysely } from 'kysely';
import { AccessRepository } from 'src/repositories/access.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetEditRepository } from 'src/repositories/asset-edit.repository';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { OcrRepository } from 'src/repositories/ocr.repository';
import { SharedLinkAssetRepository } from 'src/repositories/shared-link-asset.repository';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository';
import { StackRepository } from 'src/repositories/stack.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { AssetService } from 'src/services/asset.service';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(AssetService, {
    database: db || defaultDatabase,
    real: [
      AssetRepository,
      AssetEditRepository,
      AssetJobRepository,
      AlbumRepository,
      AccessRepository,
      SharedLinkAssetRepository,
      StackRepository,
      UserRepository,
      SharedLinkRepository,
    ],
    mock: [EventRepository, LoggingRepository, JobRepository, StorageRepository, OcrRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AssetService.name, () => {
  describe('shared space permissions', () => {
    describe('asset access by role', () => {
      it('should allow asset read for any space member', async () => {
        const { sut, ctx } = setup();
        const { user: owner } = await ctx.newUser();
        const { user: viewer } = await ctx.newUser();
        const { space } = await ctx.newSharedSpace({ createdById: owner.id });
        const { asset } = await ctx.newAsset({ ownerId: owner.id });

        // Add asset to space
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });

        // Add viewer member to space
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: viewer.id, role: 'viewer' });

        const auth = factory.auth({ user: { id: viewer.id } });

        // Should be able to read asset
        await expect(sut.get(auth, asset.id)).resolves.toBeDefined();
      });

      it('should deny asset edit if user is VIEWER role', async () => {
        const { sut, ctx } = setup();
        ctx.getMock(JobRepository).queue.mockResolvedValue();
        const { user: owner } = await ctx.newUser();
        const { user: viewer } = await ctx.newUser();
        const { space } = await ctx.newSharedSpace({ createdById: owner.id });
        const { asset } = await ctx.newAsset({ ownerId: owner.id });

        // Add asset to space
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });

        // Add viewer member to space
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: viewer.id, role: 'viewer' });

        const auth = factory.auth({ user: { id: viewer.id } });

        // Should NOT be able to edit asset
        await expect(sut.update(auth, asset.id, { description: 'new' })).rejects.toThrow();
      });

      it('should allow asset edit if user is EDITOR role', async () => {
        const { sut, ctx } = setup();
        ctx.getMock(JobRepository).queue.mockResolvedValue();
        const { user: owner } = await ctx.newUser();
        const { user: editor } = await ctx.newUser();
        const { space } = await ctx.newSharedSpace({ createdById: owner.id });
        const { asset } = await ctx.newAsset({ ownerId: owner.id });

        // Add asset to space
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });

        // Add editor member to space
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: editor.id, role: 'editor' });

        const auth = factory.auth({ user: { id: editor.id } });

        // Should be able to edit asset
        await expect(sut.update(auth, asset.id, { description: 'new' })).resolves.toBeDefined();
      });

      it('should allow asset edit if user is ADMIN role', async () => {
        const { sut, ctx } = setup();
        ctx.getMock(JobRepository).queue.mockResolvedValue();
        const { user: owner } = await ctx.newUser();
        const { user: admin } = await ctx.newUser();
        const { space } = await ctx.newSharedSpace({ createdById: owner.id });
        const { asset } = await ctx.newAsset({ ownerId: owner.id });

        // Add asset to space
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });

        // Add admin member to space
        await ctx.newSharedSpaceMember({ spaceId: space.id, userId: admin.id, role: 'owner' });

        const auth = factory.auth({ user: { id: admin.id } });

        // Should be able to edit asset
        await expect(sut.update(auth, asset.id, { description: 'new' })).resolves.toBeDefined();
      });
    });

    describe('asset access control on lifecycle', () => {
      it('should deny access when user is removed from space', async () => {
        const { sut, ctx } = setup();
        const { user: owner } = await ctx.newUser();
        const { user: member } = await ctx.newUser();
        const { space } = await ctx.newSharedSpace({ createdById: owner.id });
        const { asset } = await ctx.newAsset({ ownerId: owner.id });

        // Add asset to space
        await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });

        // Add member to space
        await ctx.newSharedSpaceMember({
          spaceId: space.id,
          userId: member.id,
          role: 'editor',
        });

        const auth = factory.auth({ user: { id: member.id } });

        // Can access while member
        await expect(sut.get(auth, asset.id)).resolves.toBeDefined();

        // Remove from space
        await defaultDatabase
          .deleteFrom('shared_space_member')
          .where('spaceId', '=', space.id)
          .where('userId', '=', member.id)
          .execute();

        // Can't access after removal
        await expect(sut.get(auth, asset.id)).rejects.toThrow();
      });
    });

    describe('non-space assets', () => {
      it('should allow owner to access asset not in space', async () => {
        const { sut, ctx } = setup();
        const { user: owner } = await ctx.newUser();
        const { asset } = await ctx.newAsset({ ownerId: owner.id });

        const auth = factory.auth({ user: { id: owner.id } });

        // Owner should be able to access their own asset
        await expect(sut.get(auth, asset.id)).resolves.toBeDefined();
      });

      it('should deny non-owner access to asset not in space', async () => {
        const { sut, ctx } = setup();
        const { user: owner } = await ctx.newUser();
        const { user: other } = await ctx.newUser();
        const { asset } = await ctx.newAsset({ ownerId: owner.id });

        const auth = factory.auth({ user: { id: other.id } });

        // Non-owner should NOT be able to access asset not in space
        await expect(sut.get(auth, asset.id)).rejects.toThrow();
      });
    });
  });
});
