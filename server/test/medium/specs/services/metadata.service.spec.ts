import { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import { Stats } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { AssetFileType, JobStatus, SystemMetadataKey } from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { DB } from 'src/schema';
import { MetadataService } from 'src/services/metadata.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB, newRandomImage } from 'test/utils';

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
      CryptoRepository,
      MetadataRepository,
      PersonRepository,
      SystemMetadataRepository,
      TagRepository,
    ],
    mock: [EventRepository, JobRepository, StorageRepository, LoggingRepository],
  });

  ctx.getMock(StorageRepository).stat.mockResolvedValue({
    size: 123_456,
    mtime: new Date(654_321),
    mtimeMs: 654_321,
    birthtimeMs: 654_322,
  } as Stats);

  return { sut, ctx };
};

const createTestFile = async (exifData: Record<string, any>) => {
  const { ctx } = setup();
  const data = newRandomImage();
  const filePath = join(tmpdir(), 'test.png');
  await writeFile(filePath, data);
  await ctx.get(MetadataRepository).writeTags(filePath, exifData);
  return { filePath };
};

const enableFaces = async ({ sut, ctx }: ReturnType<typeof setup>, faces: { import?: boolean; export?: boolean }) => {
  await ctx.get(SystemMetadataRepository).set(SystemMetadataKey.SystemConfig, { metadata: { faces } });
  // the config is cached in module scope, so it has to be reloaded after changing it
  await sut.getConfig({ withCache: false });
};

const enableFaceExport = (context: ReturnType<typeof setup>) => enableFaces(context, { export: true });

/** an image with usable dimensions, unlike the 1x1 pixel of {@link newRandomImage} */
const newSizedImage = (width: number, height: number) => {
  const image = new PNG({ width, height });
  image.data.fill(255);
  return PNG.sync.write(image);
};

const newAssetWithFace = async (ctx: Awaited<ReturnType<typeof setup>>['ctx'], name: string | null) => {
  const data = newRandomImage();
  const originalPath = join(tmpdir(), `sidecar-${randomUUID()}.png`);
  await writeFile(originalPath, data);

  const { user } = await ctx.newUser();
  const { asset } = await ctx.newAsset({ originalPath, ownerId: user.id });
  await ctx.newExif({ assetId: asset.id, description: '', exifImageWidth: 1000, exifImageHeight: 100 });

  if (name !== null) {
    const { person } = await ctx.newPerson({ ownerId: user.id, name });
    await ctx.newAssetFace({
      assetId: asset.id,
      personId: person.id,
      imageWidth: 1000,
      imageHeight: 100,
      boundingBoxX1: 0,
      boundingBoxX2: 200,
      boundingBoxY1: 20,
      boundingBoxY2: 60,
    });
  }

  return { asset, sidecarPath: `${originalPath}.xmp` };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(MetadataService.name, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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
  });

  it('should handle float lens models (#30492)', async () => {
    const { sut, ctx } = setup();
    ctx.getMock(EventRepository).emit.mockResolvedValue();
    const { filePath } = await createTestFile({ LensModel: 1.8 });
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ originalPath: filePath, ownerId: user.id });
    await ctx.newExif({ assetId: asset.id, description: '' });

    await sut.handleMetadataExtraction({ id: asset.id });

    await expect(
      ctx.database
        .selectFrom('asset_exif')
        .where('assetId', '=', asset.id)
        .select('lensModel')
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ lensModel: '1.8' });
  });

  describe('handleSidecarWrite', () => {
    it('should write named people to the sidecar file', async () => {
      const context = setup();
      const { sut, ctx } = context;
      await enableFaceExport(context);
      const { asset, sidecarPath } = await newAssetWithFace(ctx, 'Alice');

      await expect(sut.handleSidecarWrite({ id: asset.id, faces: true })).resolves.toBe(JobStatus.Success);

      const tags = await ctx.get(MetadataRepository).readTags(sidecarPath);
      expect(tags.RegionInfo).toEqual({
        AppliedToDimensions: { W: 1000, H: 100, Unit: 'pixel' },
        RegionList: [
          {
            Type: 'Face',
            Name: 'Alice',
            Area: { X: 0.1, Y: 0.4, W: 0.2, H: 0.4, Unit: 'normalized' },
          },
        ],
      });
    });

    it('should reach a fixed point when the same faces are imported and exported repeatedly', async () => {
      const context = setup();
      const { sut, ctx } = context;
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      ctx.getMock(JobRepository).queueAll.mockResolvedValue();
      await enableFaces(context, { import: true, export: true });

      const originalPath = join(tmpdir(), `roundtrip-${randomUUID()}.png`);
      await writeFile(originalPath, newSizedImage(1000, 100));
      const sidecarPath = `${originalPath}.xmp`;

      // regions as another application would have written them
      const regionInfo = {
        AppliedToDimensions: { W: 1000, H: 100, Unit: 'pixel' },
        RegionList: [
          { Type: 'Face', Name: 'Alice', Area: { X: 0.1, Y: 0.4, W: 0.2, H: 0.4, Unit: 'normalized' } },
          { Type: 'Face', Name: 'Bob', Area: { X: 0.6, Y: 0.5, W: 0.1, H: 0.2, Unit: 'normalized' } },
        ],
      };
      await ctx.get(MetadataRepository).writeTags(sidecarPath, { RegionInfo: regionInfo });

      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ originalPath, ownerId: user.id });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.Sidecar, path: sidecarPath });

      const cycle = async () => {
        await sut.handleMetadataExtraction({ id: asset.id });
        await expect(sut.handleSidecarWrite({ id: asset.id, faces: true })).resolves.toBe(JobStatus.Success);
        const { RegionInfo } = await ctx.get(MetadataRepository).readTags(sidecarPath);
        return RegionInfo;
      };

      const first = await cycle();
      const second = await cycle();

      // importing quantizes the normalized areas to whole pixels, so the first round trip can move an edge by up to a
      // pixel. What matters is that it settles there instead of drifting a little further on every pass.
      expect(second).toEqual(first);

      expect(first?.AppliedToDimensions).toEqual({ W: 1000, H: 100, Unit: 'pixel' });
      expect(first?.RegionList.map(({ Name }) => Name)).toEqual(['Alice', 'Bob']);
    });

    it('should not write anything for faces without a named person', async () => {
      const context = setup();
      const { sut, ctx } = context;
      await enableFaceExport(context);
      const { asset, sidecarPath } = await newAssetWithFace(ctx, null);

      await expect(sut.handleSidecarWrite({ id: asset.id, faces: true })).resolves.toBe(JobStatus.Skipped);
      await expect(stat(sidecarPath)).rejects.toThrow();
    });

    it('should remove regions once the named people are gone', async () => {
      const context = setup();
      const { sut, ctx } = context;
      await enableFaceExport(context);
      const { asset, sidecarPath } = await newAssetWithFace(ctx, 'Alice');

      await sut.handleSidecarWrite({ id: asset.id, faces: true });
      await ctx.database.deleteFrom('asset_face').where('assetId', '=', asset.id).execute();
      await expect(sut.handleSidecarWrite({ id: asset.id, faces: true })).resolves.toBe(JobStatus.Success);

      const tags = await ctx.get(MetadataRepository).readTags(sidecarPath);
      expect(tags.RegionInfo?.RegionList).toBeUndefined();
    });

    it('should keep other sidecar metadata when writing faces', async () => {
      const context = setup();
      const { sut, ctx } = context;
      await enableFaceExport(context);
      const { asset, sidecarPath } = await newAssetWithFace(ctx, 'Alice');
      await ctx.get(MetadataRepository).writeTags(sidecarPath, { Description: 'a description' });

      await expect(sut.handleSidecarWrite({ id: asset.id, faces: true })).resolves.toBe(JobStatus.Success);

      const tags = await ctx.get(MetadataRepository).readTags(sidecarPath);
      expect(tags.Description).toBe('a description');
      expect(tags.RegionInfo).toBeDefined();
    });
  });
});
