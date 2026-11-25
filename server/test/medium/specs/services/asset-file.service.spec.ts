import { Kysely } from 'kysely';
import { AuthDto } from 'src/dtos/auth.dto.js';
import { AlbumUserRole, AssetFileType, AssetVisibility, SharedLinkType } from 'src/enum.js';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { AlbumUserRepository } from 'src/repositories/album-user.repository.js';
import { AlbumRepository } from 'src/repositories/album.repository.js';
import { AssetFileRepository } from 'src/repositories/asset-file.repository.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { JobRepository } from 'src/repositories/job.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { PartnerRepository } from 'src/repositories/partner.repository.js';
import { ResourceRepository } from 'src/repositories/resource.repository.js';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository.js';
import { DB } from 'src/schema/index.js';
import { AssetFileService } from 'src/services/asset-file.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = () => {
  return newMediumService(AssetFileService, {
    database: defaultDatabase,
    real: [
      AccessRepository,
      AlbumRepository,
      AlbumUserRepository,
      AssetFileRepository,
      AssetRepository,
      PartnerRepository,
      SharedLinkRepository,
    ],
    mock: [JobRepository, LoggingRepository, ResourceRepository],
  });
};

const getFileId = async (assetId: string, type: AssetFileType) => {
  const { id } = await defaultDatabase
    .selectFrom('asset_file')
    .select('id')
    .where('assetId', '=', assetId)
    .where('type', '=', type)
    .executeTakeFirstOrThrow();
  return id;
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AssetFileService.name, () => {
  describe('search', () => {
    it('should list the original file', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, originalPath: '/data/upload/photo.jpg' });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: '/data/thumbs/preview.jpg' });

      const files = await sut.search(factory.auth({ user }), { assetId: asset.id });

      expect(files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: AssetFileType.Original, path: '/data/upload/photo.jpg' }),
          expect.objectContaining({ type: AssetFileType.Preview, path: '/data/thumbs/preview.jpg' }),
        ]),
      );
      expect(files).toHaveLength(2);
    });
  });

  describe('get', () => {
    it.each([AssetFileType.Original, AssetFileType.Preview])(
      'should return the %s file to an album member',
      async (type) => {
        const { sut, ctx } = setup();
        const { asset, sharedWith } = await ctx.newSharedAlbum();
        await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: '/data/thumbs/preview.jpg' });
        const fileId = await getFileId(asset.id, type);

        await expect(sut.get(factory.auth({ user: sharedWith }), fileId)).resolves.toEqual(
          expect.objectContaining({ id: fileId, type }),
        );
      },
    );

    it('should return the motion part of a live photo to an album member', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: sharedWith } = await ctx.newUser();
      const { asset: motion } = await ctx.newAsset({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, livePhotoVideoId: motion.id });
      const { album } = await ctx.newAlbum({ ownerId: owner.id }, [asset.id]);
      await ctx.newAlbumUser({ albumId: album.id, userId: sharedWith.id, role: AlbumUserRole.Viewer });
      const fileId = await getFileId(motion.id, AssetFileType.Original);

      await expect(sut.get(factory.auth({ user: sharedWith }), fileId)).resolves.toEqual(
        expect.objectContaining({ id: fileId }),
      );
    });

    it('should return the motion part of a live photo to a shared link viewer', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { asset: motion } = await ctx.newAsset({ ownerId: owner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, livePhotoVideoId: motion.id });
      const sharedLink = await ctx.get(SharedLinkRepository).create({
        key: Buffer.from('asset-file-motion'),
        type: SharedLinkType.Individual,
        userId: owner.id,
        allowUpload: false,
        assetIds: [asset.id],
      });
      const fileId = await getFileId(motion.id, AssetFileType.Original);

      await expect(sut.get(factory.auth({ sharedLink: { id: sharedLink.id } }), fileId)).resolves.toEqual(
        expect.objectContaining({ id: fileId }),
      );
    });

    it('should not return a locked file to a partner', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      await ctx.newPartner({ sharedById: owner.id, sharedWithId: partner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Locked });
      const fileId = await getFileId(asset.id, AssetFileType.Original);

      await expect(sut.get(factory.auth({ user: partner }), fileId)).rejects.toThrow(
        'Not found or no assetFile.read access',
      );
    });

    it('should return the original file to a partner', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: partner } = await ctx.newUser();
      await ctx.newPartner({ sharedById: owner.id, sharedWithId: partner.id });
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      const fileId = await getFileId(asset.id, AssetFileType.Original);

      await expect(sut.get(factory.auth({ user: partner }), fileId)).resolves.toEqual(
        expect.objectContaining({ id: fileId }),
      );
    });

    it('should return the original file to a shared link viewer', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      const sharedLink = await ctx.get(SharedLinkRepository).create({
        key: Buffer.from('asset-file-read'),
        type: SharedLinkType.Individual,
        userId: owner.id,
        allowUpload: false,
        assetIds: [asset.id],
      });
      const fileId = await getFileId(asset.id, AssetFileType.Original);

      await expect(sut.get(factory.auth({ sharedLink: { id: sharedLink.id } }), fileId)).resolves.toEqual(
        expect.objectContaining({ id: fileId }),
      );
    });

    it.each([
      {
        action: 'get',
        call: (sut: AssetFileService, auth: AuthDto, file: { id: string; assetId: string }) => sut.get(auth, file.id),
        error: 'Not found or no assetFile.read access',
      },
      {
        action: 'download',
        call: (sut: AssetFileService, auth: AuthDto, file: { id: string; assetId: string }) =>
          sut.download(auth, file.id),
        error: 'Not found or no assetFile.download access',
      },
      {
        action: 'search',
        call: (sut: AssetFileService, auth: AuthDto, file: { id: string; assetId: string }) =>
          sut.search(auth, { assetId: file.assetId }),
        error: 'Not found or no assetFile.read access',
      },
    ])('should not $action a file for a shared link that hides metadata', async ({ call, error }) => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      const sharedLink = await ctx.get(SharedLinkRepository).create({
        key: Buffer.from(`asset-file-hidden-${asset.id}`),
        type: SharedLinkType.Individual,
        userId: owner.id,
        allowUpload: false,
        allowDownload: true,
        showExif: false,
        assetIds: [asset.id],
      });
      const fileId = await getFileId(asset.id, AssetFileType.Original);
      const auth = factory.auth({ sharedLink: { id: sharedLink.id, allowDownload: true, showExif: false } });

      await expect(call(sut, auth, { id: fileId, assetId: asset.id })).rejects.toThrow(error);
    });

    it('should not return a file to a user without access to the asset', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: stranger } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      const fileId = await getFileId(asset.id, AssetFileType.Original);

      await expect(sut.get(factory.auth({ user: stranger }), fileId)).rejects.toThrow(
        'Not found or no assetFile.read access',
      );
    });
  });

  describe('download', () => {
    it('should not serve a file to a shared link viewer without download access', async () => {
      const { sut, ctx } = setup();
      const { user: owner } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      const sharedLink = await ctx.get(SharedLinkRepository).create({
        key: Buffer.from('asset-file-download'),
        type: SharedLinkType.Individual,
        userId: owner.id,
        allowUpload: false,
        allowDownload: false,
        assetIds: [asset.id],
      });
      const fileId = await getFileId(asset.id, AssetFileType.Original);

      await expect(
        sut.download(factory.auth({ sharedLink: { id: sharedLink.id, allowDownload: false } }), fileId),
      ).rejects.toThrow('Not found or no assetFile.download access');
    });
  });

  describe('delete', () => {
    it('should not delete a file for an album member', async () => {
      const { sut, ctx } = setup();
      const { asset, sharedWith } = await ctx.newSharedAlbum();
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Preview, path: '/data/thumbs/preview.jpg' });
      const fileId = await getFileId(asset.id, AssetFileType.Preview);

      await expect(sut.delete(factory.auth({ user: sharedWith }), fileId)).rejects.toThrow(
        'Not found or no assetFile.delete access',
      );
    });
  });
});
