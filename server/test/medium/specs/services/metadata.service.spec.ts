import { Kysely } from 'kysely';
import { Stats } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AssetVisibility, JobName, JobStatus, SharedSpaceRole, SourceType } from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { FaceIdentityRepository } from 'src/repositories/face-identity.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { DB } from 'src/schema';
import { MetadataService } from 'src/services/metadata.service';
import { PersonService } from 'src/services/person.service';
import { SharedSpaceService } from 'src/services/shared-space.service';
import { clearConfigCache } from 'src/utils/config';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB, newRandomImage } from 'test/utils';
import { Mocked } from 'vitest';

type TimeZoneTest = {
  description: string;
  serverTimeZone?: string;
  exifData: Record<string, any>;
  expected: {
    localDateTime: string;
    dateTimeOriginal: string;
    timeZone: string | null;
  };
};

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { sut, ctx } = newMediumService(MetadataService, {
    database: db || defaultDatabase,
    real: [
      AssetRepository,
      AssetJobRepository,
      ConfigRepository,
      MetadataRepository,
      SystemMetadataRepository,
      TagRepository,
    ],
    mock: [EventRepository, StorageRepository, LoggingRepository],
  });

  ctx.getMock(StorageRepository).stat.mockResolvedValue({
    size: 123_456,
    mtime: new Date(654_321),
    mtimeMs: 654_321,
    birthtimeMs: 654_322,
  } as Stats);

  return { sut, ctx };
};

const setupFaceImport = (db?: Kysely<DB>) => {
  clearConfigCache();

  const { sut, ctx } = newMediumService(MetadataService, {
    database: db || defaultDatabase,
    real: [
      AssetRepository,
      AssetJobRepository,
      ConfigRepository,
      CryptoRepository,
      FaceIdentityRepository,
      MetadataRepository,
      PersonRepository,
      SharedSpaceRepository,
      TagRepository,
    ],
    mock: [EventRepository, JobRepository, LoggingRepository, StorageRepository, SystemMetadataRepository],
  });

  ctx.getMock(EventRepository).emit.mockResolvedValue();
  ctx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository).queueAll.mockResolvedValue();
  ctx
    .getMock<SystemMetadataRepository, Mocked<SystemMetadataRepository>>(SystemMetadataRepository)
    .get.mockResolvedValue({
      metadata: { faces: { import: true } },
      machineLearning: { facialRecognition: { minFaces: 1 } },
    } as any);
  ctx.getMock(StorageRepository).stat.mockResolvedValue({
    size: 123_456,
    mtime: new Date(654_321),
    mtimeMs: 654_321,
    birthtimeMs: 654_322,
  } as Stats);

  return { sut, ctx };
};

const setupPersonService = (db?: Kysely<DB>) => {
  clearConfigCache();

  const { sut, ctx } = newMediumService(PersonService, {
    database: db || defaultDatabase,
    real: [ConfigRepository, FaceIdentityRepository],
    mock: [LoggingRepository, SystemMetadataRepository],
  });

  ctx
    .getMock<SystemMetadataRepository, Mocked<SystemMetadataRepository>>(SystemMetadataRepository)
    .get.mockResolvedValue({
      machineLearning: { facialRecognition: { minFaces: 1 } },
    } as any);

  return { sut, ctx };
};

const setupFaceIdentityBackfillService = (db?: Kysely<DB>) => {
  clearConfigCache();

  const { sut, ctx } = newMediumService(PersonService, {
    database: db || defaultDatabase,
    real: [FaceIdentityRepository, SharedSpaceRepository],
    mock: [JobRepository, LoggingRepository],
  });

  ctx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository).queue.mockResolvedValue();
  ctx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository).queueAll.mockResolvedValue();

  return { sut, ctx };
};

const setupSharedSpaceService = (db?: Kysely<DB>) => {
  clearConfigCache();

  const { sut, ctx } = newMediumService(SharedSpaceService, {
    database: db || defaultDatabase,
    real: [ConfigRepository, PersonRepository, SharedSpaceRepository],
    mock: [JobRepository, LoggingRepository, SystemMetadataRepository],
  });

  ctx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository).queue.mockResolvedValue();
  ctx
    .getMock<SystemMetadataRepository, Mocked<SystemMetadataRepository>>(SystemMetadataRepository)
    .get.mockResolvedValue({
      machineLearning: { facialRecognition: { maxDistance: 0.5 } },
    } as any);

  return { sut, ctx };
};

const metadataFaceTags = (name: string) => ({
  RegionInfo: {
    AppliedToDimensions: { W: 1000, H: 100, Unit: 'pixel' },
    RegionList: [
      {
        Type: 'face',
        Name: name,
        Area: { X: 0.1, Y: 0.4, W: 0.2, H: 0.4, Unit: 'normalized' },
      },
    ],
  },
});

const getAssetFaceIdentityLinks = (db: Kysely<DB>, assetId: string) =>
  db
    .selectFrom('face_identity_face')
    .innerJoin('asset_face', 'asset_face.id', 'face_identity_face.assetFaceId')
    .innerJoin('person', 'person.id', 'asset_face.personId')
    .select(['asset_face.id as assetFaceId', 'person.name', 'face_identity_face.source', 'asset_face.sourceType'])
    .where('asset_face.assetId', '=', assetId)
    .execute();

const createTestFile = async (exifData: Record<string, any>) => {
  const { ctx } = setup();
  const data = newRandomImage();
  const filePath = join(tmpdir(), 'test.png');
  await writeFile(filePath, data);
  await ctx.get(MetadataRepository).writeTags(filePath, exifData);
  return { filePath };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(MetadataService.name, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearConfigCache();
  });

  it('should be defined', () => {
    const { sut } = setup();
    expect(sut).toBeDefined();
  });

  describe('handleMetadataExtraction', () => {
    const timeZoneTests: TimeZoneTest[] = [
      {
        description: 'should handle no time zone information',
        exifData: {
          DateTimeOriginal: '2022:01:01 00:00:00',
        },
        expected: {
          localDateTime: '2022-01-01T00:00:00.000Z',
          dateTimeOriginal: '2022-01-01T00:00:00.000Z',
          timeZone: null,
        },
      },
      {
        description: 'should handle a +13:00 time zone',
        exifData: {
          DateTimeOriginal: '2022:01:01 00:00:00+13:00',
        },
        expected: {
          localDateTime: '2022-01-01T00:00:00.000Z',
          dateTimeOriginal: '2021-12-31T11:00:00.000Z',
          timeZone: 'UTC+13',
        },
      },
    ];

    it.each(timeZoneTests)('$description', async ({ exifData, serverTimeZone, expected }) => {
      vi.stubEnv('TZ', serverTimeZone);

      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const { filePath } = await createTestFile(exifData);
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ originalPath: filePath, ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, description: '' });

      await sut.handleMetadataExtraction({ id: asset.id });

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select(['dateTimeOriginal', 'timeZone', 'lockedProperties'])
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({
        dateTimeOriginal: new Date(expected.dateTimeOriginal),
        timeZone: expected.timeZone,
        lockedProperties: null,
      });

      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toEqual(
        expect.objectContaining({ localDateTime: new Date(expected.localDateTime) }),
      );
    });

    it('should handle dates far in the future', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const { filePath } = await createTestFile({ CreateDate: '42603:05:04 04:12:48' });
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ originalPath: filePath, ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, description: '' });

      await sut.handleMetadataExtraction({ id: asset.id });

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .where('assetId', '=', asset.id)
          .select('dateTimeOriginal')
          .executeTakeFirstOrThrow(),
        // note that this date is technically wrong. it does not throw though and should get the user's attention either way.
      ).resolves.toEqual({ dateTimeOriginal: new Date('4260-03-05T04:04:12.000Z') });
    });

    it('should expose imported metadata people through identity-backed people', async () => {
      const { sut, ctx } = setupFaceImport();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        originalPath: '/photos/alice.jpg',
        visibility: AssetVisibility.Timeline,
      });
      await ctx.newExif({ assetId: asset.id, description: '' });
      vi.spyOn(ctx.get(MetadataRepository), 'readTags').mockResolvedValue(metadataFaceTags('Alice Metadata'));

      await sut.handleMetadataExtraction({ id: asset.id });

      const { sut: personService } = setupPersonService(ctx.database);
      const people = await personService.getAll(factory.auth({ user }), {
        withHidden: true,
        withSharedSpaces: true,
        page: 1,
        size: 50,
      } as any);
      const identityLinks = await ctx.database
        .selectFrom('face_identity_face')
        .innerJoin('asset_face', 'asset_face.id', 'face_identity_face.assetFaceId')
        .select(['face_identity_face.source', 'asset_face.sourceType'])
        .where('asset_face.assetId', '=', asset.id)
        .execute();

      expect(people.people).toEqual([
        expect.objectContaining({
          name: 'Alice Metadata',
          numberOfAssets: 1,
          primaryProfile: expect.objectContaining({ type: 'user-person' }),
        }),
      ]);
      expect(identityLinks).toEqual([{ source: 'import', sourceType: SourceType.Exif }]);
    });

    it('should remove stale imported identity links when metadata faces are re-imported', async () => {
      const { sut, ctx } = setupFaceImport();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        originalPath: '/photos/renamed-face.jpg',
        visibility: AssetVisibility.Timeline,
      });
      await ctx.newExif({ assetId: asset.id, description: '' });
      vi.spyOn(ctx.get(MetadataRepository), 'readTags')
        .mockResolvedValueOnce(metadataFaceTags('Alice Metadata'))
        .mockResolvedValueOnce(metadataFaceTags('Bob Metadata'));

      await sut.handleMetadataExtraction({ id: asset.id });
      expect(await getAssetFaceIdentityLinks(ctx.database, asset.id)).toEqual([
        expect.objectContaining({ name: 'Alice Metadata', source: 'import', sourceType: SourceType.Exif }),
      ]);

      await sut.handleMetadataExtraction({ id: asset.id });

      expect(await getAssetFaceIdentityLinks(ctx.database, asset.id)).toEqual([
        expect.objectContaining({ name: 'Bob Metadata', source: 'import', sourceType: SourceType.Exif }),
      ]);
    });

    it('should link imported metadata faces to an existing person without an identity', async () => {
      const { sut, ctx } = setupFaceImport();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({
        ownerId: user.id,
        name: 'Existing Metadata',
        faceAssetId: null,
        identityId: null,
      });
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        originalPath: '/photos/existing-person.jpg',
        visibility: AssetVisibility.Timeline,
      });
      await ctx.newExif({ assetId: asset.id, description: '' });
      vi.spyOn(ctx.get(MetadataRepository), 'readTags').mockResolvedValue(metadataFaceTags('Existing Metadata'));

      await sut.handleMetadataExtraction({ id: asset.id });

      const [{ identityId }] = await ctx.database
        .selectFrom('person')
        .select('identityId')
        .where('id', '=', person.id)
        .execute();
      const { sut: personService } = setupPersonService(ctx.database);
      const people = await personService.getAll(factory.auth({ user }), {
        withHidden: true,
        withSharedSpaces: true,
        page: 1,
        size: 50,
      } as any);

      expect(identityId).toEqual(expect.any(String));
      expect(await getAssetFaceIdentityLinks(ctx.database, asset.id)).toEqual([
        expect.objectContaining({ name: 'Existing Metadata', source: 'import', sourceType: SourceType.Exif }),
      ]);
      expect(people.people).toContainEqual(
        expect.objectContaining({
          name: 'Existing Metadata',
          numberOfAssets: 1,
          primaryProfile: expect.objectContaining({ id: person.id, type: 'user-person' }),
        }),
      );
    });

    it('should expose imported metadata people in shared spaces before face detection creates embeddings', async () => {
      const { sut, ctx } = setupFaceImport();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        originalPath: '/photos/space-person.jpg',
        visibility: AssetVisibility.Timeline,
      });
      const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
      await ctx.newExif({ assetId: asset.id, description: '' });
      vi.spyOn(ctx.get(MetadataRepository), 'readTags').mockResolvedValue(metadataFaceTags('Space Metadata'));

      await sut.handleMetadataExtraction({ id: asset.id });
      const importedFacesWithoutEmbeddings = await ctx.database
        .selectFrom('asset_face')
        .leftJoin('face_search', 'face_search.faceId', 'asset_face.id')
        .select(['asset_face.id', 'face_search.faceId'])
        .where('asset_face.assetId', '=', asset.id)
        .where('asset_face.sourceType', '=', SourceType.Exif)
        .execute();
      const { sut: sharedSpaceService, ctx: sharedSpaceCtx } = setupSharedSpaceService(ctx.database);

      await expect(
        sharedSpaceService.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: asset.id }),
      ).resolves.toBe(JobStatus.Success);

      const spacePeople = await ctx.database
        .selectFrom('shared_space_person')
        .innerJoin('shared_space_person_face', 'shared_space_person_face.personId', 'shared_space_person.id')
        .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
        .select([
          'shared_space_person.name',
          'shared_space_person.faceCount',
          'shared_space_person.identityId',
          'asset_face.sourceType',
        ])
        .where('shared_space_person.spaceId', '=', space.id)
        .execute();

      expect(importedFacesWithoutEmbeddings).toEqual([{ id: expect.any(String), faceId: null }]);
      expect(spacePeople).toEqual([
        expect.objectContaining({
          name: 'Space Metadata',
          faceCount: 1,
          identityId: expect.any(String),
          sourceType: SourceType.Exif,
        }),
      ]);
      expect(sharedSpaceCtx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository).queue).toHaveBeenCalledWith({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId: space.id },
      });
    });

    it('should backfill legacy imported metadata faces into shared spaces without embeddings', async () => {
      const { ctx } = setupFaceImport();
      const { user } = await ctx.newUser();
      const { person } = await ctx.newPerson({
        ownerId: user.id,
        name: 'Legacy Metadata',
        faceAssetId: null,
        identityId: null,
      });
      const { asset } = await ctx.newAsset({
        ownerId: user.id,
        originalPath: '/photos/legacy-space-person.jpg',
        visibility: AssetVisibility.Timeline,
      });
      const { assetFace } = await ctx.newAssetFace({
        assetId: asset.id,
        personId: person.id,
        sourceType: SourceType.Exif,
      });
      await ctx.database.updateTable('person').set({ faceAssetId: assetFace.id }).where('id', '=', person.id).execute();
      const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
      const { sut: backfillService, ctx: backfillCtx } = setupFaceIdentityBackfillService(ctx.database);
      const { sut: sharedSpaceService } = setupSharedSpaceService(ctx.database);

      await expect(
        ctx.database
          .selectFrom('asset_face')
          .leftJoin('face_search', 'face_search.faceId', 'asset_face.id')
          .leftJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
          .select(['face_search.faceId', 'face_identity_face.identityId'])
          .where('asset_face.id', '=', assetFace.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ faceId: null, identityId: null });

      await expect(backfillService.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);
      await expect(sharedSpaceService.handleSharedSpaceFaceMatchAll({ spaceId: space.id })).resolves.toBe(
        JobStatus.Success,
      );

      const identityLinks = await ctx.database
        .selectFrom('face_identity_face')
        .select(['assetFaceId', 'source'])
        .where('assetFaceId', '=', assetFace.id)
        .execute();
      const spacePeople = await ctx.database
        .selectFrom('shared_space_person')
        .innerJoin('shared_space_person_face', 'shared_space_person_face.personId', 'shared_space_person.id')
        .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
        .select([
          'shared_space_person.name',
          'shared_space_person.faceCount',
          'shared_space_person.identityId',
          'asset_face.sourceType',
        ])
        .where('shared_space_person.spaceId', '=', space.id)
        .execute();

      expect(identityLinks).toEqual([{ assetFaceId: assetFace.id, source: 'backfill' }]);
      expect(backfillCtx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository).queueAll).toHaveBeenCalledWith(
        expect.arrayContaining([{ name: JobName.SharedSpaceFaceMatchAll, data: { spaceId: space.id } }]),
      );
      expect(spacePeople).toEqual([
        expect.objectContaining({
          name: 'Legacy Metadata',
          faceCount: 1,
          identityId: expect.any(String),
          sourceType: SourceType.Exif,
        }),
      ]);
    });
  });
});
