import { Kysely } from 'kysely';
import { Stats } from 'node:fs';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, parse } from 'node:path';
import { AssetFileType, JobName, JobStatus, QueueName } from 'src/enum.js';
import { AssetJobRepository } from 'src/repositories/asset-job.repository.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { EventRepository } from 'src/repositories/event.repository.js';
import { JobRepository } from 'src/repositories/job.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MetadataRepository } from 'src/repositories/metadata.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
import { TagRepository } from 'src/repositories/tag.repository.js';
import { DB } from 'src/schema/index.js';
import { JobService } from 'src/services/job.service.js';
import { MetadataService } from 'src/services/metadata.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { getKyselyDB, newRandomImage } from 'test/utils.js';

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

const setup = (db?: Kysely<DB>, { realStorage = false } = {}) => {
  const { sut, ctx } = newMediumService(MetadataService, {
    database: db || defaultDatabase,
    real: [
      AssetRepository,
      AssetJobRepository,
      ConfigRepository,
      MetadataRepository,
      SystemMetadataRepository,
      TagRepository,
      ...(realStorage ? [StorageRepository] : []),
    ],
    mock: [EventRepository, LoggingRepository, ...(realStorage ? [] : [StorageRepository])],
  });

  if (!realStorage) {
    ctx.getMock(StorageRepository).stat.mockResolvedValue({
      size: 123_456,
      mtime: new Date(654_321),
      mtimeMs: 654_321,
      birthtimeMs: 654_322,
    } as Stats);
  }

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

  describe('handleSidecarCheck', () => {
    let tempDir: string;
    let sut: MetadataService;
    let ctx: ReturnType<typeof setup>['ctx'];

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'immich-sidecar-'));
      ({ sut, ctx } = newMediumService(MetadataService, {
        database: defaultDatabase,
        real: [AssetRepository, AssetJobRepository, StorageRepository],
        mock: [EventRepository, LoggingRepository],
      }));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    const createFile = async (filename: string) => {
      const filePath = join(tempDir, filename);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, 'test');
      return filePath;
    };

    const createAsset = async (filename = 'photo.jpg') => {
      const { user } = await ctx.newUser();
      const originalPath = await createFile(filename);
      const { asset } = await ctx.newAsset({ ownerId: user.id, originalPath });
      return asset;
    };

    const getSidecar = (assetId: string) =>
      ctx.database
        .selectFrom('asset_file')
        .where('assetId', '=', assetId)
        .where('type', '=', AssetFileType.Sidecar)
        .selectAll()
        .executeTakeFirst();

    it.each(['photo.jpg.xmp', 'photo.xmp'])('should discover %s', async (filename) => {
      const asset = await createAsset();
      const sidecarPath = await createFile(filename);

      await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Success);

      await expect(getSidecar(asset.id)).resolves.toEqual(expect.objectContaining({ path: sidecarPath }));
    });

    it('should prefer the extended filename when both candidates exist', async () => {
      const asset = await createAsset();
      const preferred = await createFile('photo.jpg.xmp');
      await createFile('photo.xmp');

      await sut.handleSidecarCheck({ id: asset.id });

      await expect(getSidecar(asset.id)).resolves.toEqual(expect.objectContaining({ path: preferred }));
    });

    it('should preserve an existing association ahead of both conventional candidates', async () => {
      const asset = await createAsset();
      const existing = await createFile('elsewhere/custom.xmp');
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Sidecar,
        path: existing,
      });
      await createFile('photo.jpg.xmp');
      await createFile('photo.xmp');
      const before = await getSidecar(asset.id);

      await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Skipped);

      await expect(getSidecar(asset.id)).resolves.toEqual(before);
    });

    it.each(['photo.jpg.xmp', 'photo.xmp'])('should replace a missing association with %s', async (filename) => {
      const asset = await createAsset();
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Sidecar,
        path: join(tempDir, 'missing.xmp'),
      });
      const replacement = await createFile(filename);

      await sut.handleSidecarCheck({ id: asset.id });

      await expect(getSidecar(asset.id)).resolves.toEqual(expect.objectContaining({ path: replacement }));
    });

    it('should leave an asset without an association when no sidecar exists', async () => {
      const asset = await createAsset();

      await sut.handleSidecarCheck({ id: asset.id });

      await expect(getSidecar(asset.id)).resolves.toBeUndefined();
    });

    it('should remove a missing association without deleting other asset files', async () => {
      const asset = await createAsset();
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Sidecar,
        path: join(tempDir, 'missing.xmp'),
      });
      const thumbnailPath = join(tempDir, 'thumbnail.jpg');
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Thumbnail,
        path: thumbnailPath,
      });

      await sut.handleSidecarCheck({ id: asset.id });

      await expect(
        ctx.database.selectFrom('asset_file').where('assetId', '=', asset.id).select(['type', 'path']).execute(),
      ).resolves.toEqual([{ type: AssetFileType.Thumbnail, path: thumbnailPath }]);
    });

    it('should keep the same association on repeated discovery', async () => {
      const asset = await createAsset();
      await createFile('photo.jpg.xmp');
      await sut.handleSidecarCheck({ id: asset.id });
      const before = await getSidecar(asset.id);

      await expect(sut.handleSidecarCheck({ id: asset.id })).resolves.toBe(JobStatus.Skipped);

      await expect(getSidecar(asset.id)).resolves.toEqual(before);
    });

    it.each(['Photo.JPG.xmp', 'Photo.xmp'])('should discover %s for mixed-case media', async (filename) => {
      const asset = await createAsset('Photo.JPG');
      const sidecarPath = await createFile(filename);

      await sut.handleSidecarCheck({ id: asset.id });

      await expect(getSidecar(asset.id)).resolves.toEqual(expect.objectContaining({ path: sidecarPath }));
    });

    it.for(['PHOTO.xmp', 'photo.jpg.XMP'])(
      'should not discover %s on a case-sensitive filesystem',
      async (filename, { skip }) => {
        await createFile('case-probe');
        if (await ctx.get(StorageRepository).checkFileExists(join(tempDir, 'CASE-PROBE'))) {
          skip();
        }
        const asset = await createAsset();
        await createFile(filename);

        await sut.handleSidecarCheck({ id: asset.id });

        await expect(getSidecar(asset.id)).resolves.toBeUndefined();
      },
    );

    it.each(['photo.edit.jpg', '.photo.jpg', 'quoted"雪.jpg'])(
      'should preserve the basename when finding the fallback for %s',
      async (filename) => {
        const asset = await createAsset(filename);
        const sidecarPath = await createFile(`${parse(filename).name}.xmp`);

        await sut.handleSidecarCheck({ id: asset.id });

        await expect(getSidecar(asset.id)).resolves.toEqual(expect.objectContaining({ path: sidecarPath }));
      },
    );

    it('should associate the symlink path when its target is readable', async () => {
      const asset = await createAsset();
      const target = await createFile('elsewhere/metadata.xmp');
      const sidecarPath = join(tempDir, 'photo.jpg.xmp');
      await symlink(target, sidecarPath);

      await sut.handleSidecarCheck({ id: asset.id });

      await expect(getSidecar(asset.id)).resolves.toEqual(expect.objectContaining({ path: sidecarPath }));
    });

    it('should fall back when the preferred candidate is a broken symlink', async () => {
      const asset = await createAsset();
      await symlink(join(tempDir, 'missing.xmp'), join(tempDir, 'photo.jpg.xmp'));
      const fallback = await createFile('photo.xmp');

      await sut.handleSidecarCheck({ id: asset.id });

      await expect(getSidecar(asset.id)).resolves.toEqual(expect.objectContaining({ path: fallback }));
    });

    it('should remove an association whose symlink target disappeared', async () => {
      const asset = await createAsset();
      const sidecarPath = join(tempDir, 'photo.jpg.xmp');
      await symlink(join(tempDir, 'missing.xmp'), sidecarPath);
      await ctx.newAssetFile({
        assetId: asset.id,
        type: AssetFileType.Sidecar,
        path: sidecarPath,
      });

      await sut.handleSidecarCheck({ id: asset.id });

      await expect(getSidecar(asset.id)).resolves.toBeUndefined();
    });

    it('should extract the preferred sidecar metadata after discovery, including repeated checks', async () => {
      ({ sut, ctx } = setup(undefined, { realStorage: true }));
      const asset = await createAsset('photo.png');
      await writeFile(asset.originalPath, newRandomImage());
      await ctx.newExif({ assetId: asset.id, description: '' });
      const metadata = ctx.get(MetadataRepository);
      await metadata.writeTags(asset.originalPath, { Rating: 1 });
      const preferred = join(tempDir, 'photo.png.xmp');
      await metadata.writeTags(preferred, { Rating: 5 });
      await metadata.writeTags(join(tempDir, 'photo.xmp'), { Rating: 3 });
      ctx.getMock(EventRepository).emit.mockResolvedValue();

      const { sut: jobService, ctx: jobCtx } = newMediumService(JobService, {
        database: ctx.database,
        real: [],
        mock: [EventRepository, JobRepository, LoggingRepository],
      });
      const jobs = jobCtx.getMock(JobRepository);
      jobCtx.getMock(EventRepository).emit.mockResolvedValue();
      jobs.queue.mockResolvedValue();
      jobs.run.mockImplementation(async (job) => {
        if (job.name !== JobName.SidecarCheck) {
          throw new Error(`Unexpected job: ${job.name}`);
        }
        const status = await sut.handleSidecarCheck(job.data);
        if (status === undefined) {
          throw new Error(`Asset ${job.data.id} was not found during sidecar discovery`);
        }
        return status;
      });

      for (const status of [JobStatus.Success, JobStatus.Skipped]) {
        jobs.queue.mockClear();
        await jobService.onJobRun(QueueName.Sidecar, {
          name: JobName.SidecarCheck,
          data: { id: asset.id, source: 'upload' },
        });

        expect(jobCtx.getMock(EventRepository).emit).toHaveBeenCalledWith('JobSuccess', {
          job: {
            name: JobName.SidecarCheck,
            data: { id: asset.id, source: 'upload' },
          },
          response: status,
        });
        expect(jobs.queue).toHaveBeenCalledExactlyOnceWith({
          name: JobName.AssetExtractMetadata,
          data: { id: asset.id, source: 'upload' },
        });
        await expect(getSidecar(asset.id)).resolves.toEqual(expect.objectContaining({ path: preferred }));

        await sut.handleMetadataExtraction({ id: asset.id, source: 'upload' });

        await expect(
          ctx.database
            .selectFrom('asset_exif')
            .where('assetId', '=', asset.id)
            .select('rating')
            .executeTakeFirstOrThrow(),
        ).resolves.toEqual({ rating: 5 });
      }
    });
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

    it('should ignore IFD1 thumbnail orientation when extracting metadata', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const { filePath } = await createTestFile({ 'IFD1:Orientation#': 6 });
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ originalPath: filePath, ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, description: '' });

      await sut.handleMetadataExtraction({ id: asset.id });

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select('orientation')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ orientation: null });
    });

    it('should ignore IFD1 thumbnail dimensions when extracting metadata', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const { filePath } = await createTestFile({ 'IFD1:ImageWidth#': 160, 'IFD1:ImageHeight#': 120 });
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ originalPath: filePath, ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, description: '' });

      await sut.handleMetadataExtraction({ id: asset.id });

      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toEqual(
        expect.objectContaining({ width: 1, height: 1 }),
      );
    });

    it('should keep IFD0 orientation when extracting metadata', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const { filePath } = await createTestFile({ 'IFD0:Orientation#': 6 });
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ originalPath: filePath, ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, description: '' });

      await sut.handleMetadataExtraction({ id: asset.id });

      await expect(
        ctx.database
          .selectFrom('asset_exif')
          .select('orientation')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ orientation: '6' });
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
});
