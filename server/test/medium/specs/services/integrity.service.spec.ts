import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { createHash, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { StorageCore } from 'src/cores/storage.core';
import { AssetFileType, IntegrityReport, JobName, JobStatus, SystemMetadataKey } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { IntegrityRepository } from 'src/repositories/integrity.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { DB } from 'src/schema';
import { IntegrityService } from 'src/services/integrity.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB, makeStream } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(IntegrityService, {
    database: db || defaultDatabase,
    real: [IntegrityRepository, AssetRepository, ConfigRepository, SystemMetadataRepository],
    mock: [LoggingRepository, EventRepository, StorageRepository, JobRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
  StorageCore.setMediaLocation('/path/to/file');
});

afterAll(() => {
  StorageCore.reset();
});

describe(IntegrityService.name, () => {
  beforeEach(async () => {
    await defaultDatabase.deleteFrom('asset_file').execute();
    await defaultDatabase.deleteFrom('asset').execute();
    await defaultDatabase.deleteFrom('integrity_report').execute();
  });

  it('should work', () => {
    const { sut } = setup();
    expect(sut).toBeDefined();
  });

  describe('getIntegrityReportSummary', () => {
    it('gets summary', async () => {
      const { sut } = setup();

      await expect(sut.getIntegrityReportSummary()).resolves.toEqual({
        checksum_mismatch: 0,
        missing_file: 0,
        untracked_file: 0,
      });
    });
  });

  describe('getIntegrityReport', () => {
    it('gets report', async () => {
      const { sut } = setup();

      await expect(sut.getIntegrityReport({ type: IntegrityReport.ChecksumFail })).resolves.toEqual({
        items: [],
        nextCursor: undefined,
      });
    });
  });

  describe('getIntegrityReportCsv', () => {
    it('gets report as csv', async () => {
      const { sut, ctx } = setup();

      const { id } = await ctx.get(IntegrityRepository).create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/file',
      });

      await expect(text(sut.getIntegrityReportCsv(IntegrityReport.ChecksumFail))).resolves.toMatchInlineSnapshot(`
          "id,type,assetId,fileAssetId,path
          ${id},checksum_mismatch,null,null,"/path/to/file"
          "
        `);
    });
  });

  describe('getIntegrityReportFile', () => {
    it('gets report file', async () => {
      const { sut, ctx } = setup();

      const { id } = await ctx.get(IntegrityRepository).create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/file',
      });

      await expect(sut.getIntegrityReportFile(id)).resolves.toEqual({
        path: '/path/to/file',
        fileName: 'file',
        contentType: 'application/octet-stream',
        cacheControl: 'private_without_cache',
      });
    });
  });

  describe('deleteIntegrityReport', () => {
    it('deletes asset if one is present', async () => {
      const { sut, ctx } = setup();
      const events = ctx.getMock(EventRepository);
      events.emit.mockResolvedValue(void 0);

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const {
        result: { id: assetId },
      } = await ctx.newAsset({ ownerId });

      const { id } = await ctx.get(IntegrityRepository).create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/file',
        assetId,
      });

      await sut.deleteIntegrityReport(ownerId, id);

      await expect(ctx.get(AssetRepository).getById(assetId)).resolves.toEqual(
        expect.objectContaining({
          status: 'trashed',
        }),
      );

      expect(events.emit).toHaveBeenCalledWith('AssetTrashAll', {
        assetIds: [assetId],
        userId: ownerId,
      });

      await expect(sut.getIntegrityReport({ type: IntegrityReport.ChecksumFail })).resolves.toEqual({
        items: [],
        nextCursor: undefined,
      });
    });

    it('deletes file asset if one is present', async () => {
      const { sut, ctx } = setup();

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const {
        result: { id: assetId },
      } = await ctx.newAsset({ ownerId });

      const fileAssetId = randomUUID();
      await ctx.newAssetFile({ id: fileAssetId, assetId, type: AssetFileType.Thumbnail, path: '/path/to/file' });

      const { id } = await ctx.get(IntegrityRepository).create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/file',
        fileAssetId,
      });

      await sut.deleteIntegrityReport('userId', id);

      await expect(ctx.get(AssetRepository).getForThumbnail(assetId, AssetFileType.Thumbnail, false)).resolves.toEqual(
        expect.objectContaining({
          path: null,
        }),
      );
    });

    it('deletes untracked file', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      storage.unlink.mockResolvedValue(void 0);

      const {
        result: { id: userId },
      } = await ctx.newUser();

      const { id } = await ctx.get(IntegrityRepository).create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/file',
      });

      await sut.deleteIntegrityReport(userId, id);

      expect(storage.unlink).toHaveBeenCalledWith('/path/to/file');
    });
  });

  describe('handleUntrackedFilesQueueAll', () => {
    it('should succeed', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const job = ctx.getMock(JobRepository);

      job.queue.mockResolvedValue(void 0);
      storage.walk.mockImplementation(() => makeStream([['/path/to/file', '/path/to/file2'], ['/path/to/batch2']]));

      await expect(sut.handleUntrackedFilesQueueAll({ refreshOnly: false })).resolves.toBe(JobStatus.Success);
    });

    it('queues jobs for all detected files', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const job = ctx.getMock(JobRepository);

      job.queue.mockResolvedValue(void 0);

      storage.walk.mockReturnValueOnce(makeStream([['/path/to/file', '/path/to/file2'], ['/path/to/batch2']]));
      storage.walk.mockReturnValueOnce(makeStream([['/path/to/file3', '/path/to/file4'], ['/path/to/batch4']]));

      await sut.handleUntrackedFilesQueueAll({ refreshOnly: false });

      expect(job.queue).toBeCalledTimes(4);
      expect(job.queue).toBeCalledWith({
        name: JobName.IntegrityUntrackedFiles,
        data: {
          type: 'asset',
          paths: expect.arrayContaining(['/path/to/file']),
        },
      });

      expect(job.queue).toBeCalledWith({
        name: JobName.IntegrityUntrackedFiles,
        data: {
          type: 'asset_file',
          paths: expect.arrayContaining(['/path/to/file3']),
        },
      });
    });

    it('queues jobs to refresh reports', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const job = ctx.getMock(JobRepository);

      job.queue.mockResolvedValue(void 0);
      storage.walk.mockImplementation(() => makeStream([['/path/to/file', '/path/to/file2'], ['/path/to/batch2']]));

      const { id } = await ctx.get(IntegrityRepository).create({
        type: IntegrityReport.UntrackedFile,
        path: '/path/to/file',
      });

      await sut.handleUntrackedFilesQueueAll({ refreshOnly: true });

      expect(job.queue).toBeCalledTimes(1);
      expect(job.queue).toBeCalledWith({
        name: JobName.IntegrityUntrackedFilesRefresh,
        data: {
          items: expect.arrayContaining([
            {
              path: '/path/to/file',
              reportId: id,
            },
          ]),
        },
      });
    });
  });

  describe('handleUntrackedFiles', () => {
    it('should detect untracked asset files', async () => {
      const { sut, ctx } = setup();

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const { asset } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file1' });
      await ctx.newAssetFile({ assetId: asset.id, type: AssetFileType.EncodedVideo, path: '/path/to/file2' });

      await sut.handleUntrackedFiles({
        type: 'asset',
        paths: ['/path/to/file1', '/path/to/file2', '/path/to/untracked'],
      });

      await expect(
        ctx.get(IntegrityRepository).getIntegrityReport(
          {
            limit: 100,
          },
          IntegrityReport.UntrackedFile,
        ),
      ).resolves.toEqual({
        items: [
          expect.objectContaining({
            path: '/path/to/untracked',
          }),
        ],
        nextCursor: undefined,
      });
    });

    it('should detect untracked asset_file files', async () => {
      const { sut, ctx } = setup();

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const {
        result: { id: assetId },
      } = await ctx.newAsset({ ownerId });

      await ctx.newAssetFile({ assetId, type: AssetFileType.Thumbnail, path: '/path/to/file1' });

      await sut.handleUntrackedFiles({
        type: 'asset_file',
        paths: ['/path/to/file1', '/path/to/untracked'],
      });

      await expect(
        ctx.get(IntegrityRepository).getIntegrityReport(
          {
            limit: 100,
          },
          IntegrityReport.UntrackedFile,
        ),
      ).resolves.toEqual({
        items: [
          expect.objectContaining({
            path: '/path/to/untracked',
          }),
        ],
        nextCursor: undefined,
      });
    });
  });

  describe('handleUntrackedRefresh', () => {
    it('should succeed', async () => {
      const { sut } = setup();
      await expect(sut.handleUntrackedRefresh({ items: [] })).resolves.toBe(JobStatus.Success);
    });

    it('should delete reports for files that no longer exist', async () => {
      const { sut, ctx } = setup();
      const integrity = ctx.get(IntegrityRepository);
      const storage = ctx.getMock(StorageRepository);

      const report1 = await integrity.create({
        type: IntegrityReport.UntrackedFile,
        path: '/path/to/missing1',
      });

      const report2 = await integrity.create({
        type: IntegrityReport.UntrackedFile,
        path: '/path/to/existing',
      });

      storage.stat.mockRejectedValueOnce(new Error('ENOENT')).mockResolvedValueOnce({} as never);

      await sut.handleUntrackedRefresh({
        items: [
          { reportId: report1.id, path: report1.path },
          { reportId: report2.id, path: report2.path },
        ],
      });

      await expect(
        ctx.get(IntegrityRepository).getIntegrityReport(
          {
            limit: 100,
          },
          IntegrityReport.UntrackedFile,
        ),
      ).resolves.toEqual({
        items: [
          expect.objectContaining({
            path: '/path/to/existing',
          }),
        ],
        nextCursor: undefined,
      });
    });
  });

  describe('handleMissingFilesQueueAll', () => {
    it('should succeed', async () => {
      const { sut } = setup();
      await expect(sut.handleMissingFilesQueueAll()).resolves.toBe(JobStatus.Success);
    });

    it('should queue jobs', async () => {
      const { sut, ctx } = setup();
      const job = ctx.getMock(JobRepository);
      job.queue.mockResolvedValue(void 0);

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const {
        result: { id: assetId },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file1' });

      const {
        result: { id: assetId2 },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file2' });

      const { id: reportId } = await ctx.get(IntegrityRepository).create({
        type: IntegrityReport.MissingFile,
        path: '/path/to/file2',
        assetId: assetId2,
      });

      await sut.handleMissingFilesQueueAll({ refreshOnly: false });

      expect(job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityMissingFiles,
        data: {
          items: expect.arrayContaining([
            { path: '/path/to/file1', assetId, fileAssetId: null, reportId: null },
            { path: '/path/to/file2', assetId: assetId2, fileAssetId: null, reportId },
          ]),
        },
      });

      expect(job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({
          name: JobName.IntegrityMissingFilesRefresh,
        }),
      );
    });

    it('should queue refresh jobs when refreshOnly is set', async () => {
      const { sut, ctx } = setup();
      const job = ctx.getMock(JobRepository);
      job.queue.mockResolvedValue(void 0);

      const { id: reportId } = await ctx.get(IntegrityRepository).create({
        type: IntegrityReport.MissingFile,
        path: '/path/to/file1',
      });

      await sut.handleMissingFilesQueueAll({ refreshOnly: true });

      expect(job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityMissingFilesRefresh,
        data: {
          items: expect.arrayContaining([{ reportId, path: '/path/to/file1' }]),
        },
      });

      expect(job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({
          name: JobName.IntegrityMissingFiles,
        }),
      );
    });
  });

  describe('handleMissingFiles', () => {
    it('should succeed', async () => {
      const { sut } = setup();
      await expect(sut.handleMissingFiles({ items: [] })).resolves.toBe(JobStatus.Success);
    });

    it('should detect missing files and remove outdated reports', async () => {
      const { sut, ctx } = setup();
      const integrity = ctx.get(IntegrityRepository);
      const storage = ctx.getMock(StorageRepository);

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const {
        result: { id: assetId },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file1' });

      const { id: restoredId } = await integrity.create({
        type: IntegrityReport.MissingFile,
        path: '/path/to/restored',
        assetId,
      });

      storage.stat
        .mockResolvedValueOnce({} as never)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce({} as never);

      await sut.handleMissingFiles({
        items: [
          { path: '/path/to/existing', assetId, fileAssetId: null, reportId: null },
          { path: '/path/to/missing', assetId, fileAssetId: null, reportId: null },
          { path: '/path/to/restored', assetId, fileAssetId: null, reportId: restoredId },
        ],
      });

      await expect(
        ctx.get(IntegrityRepository).getIntegrityReport(
          {
            limit: 100,
          },
          IntegrityReport.MissingFile,
        ),
      ).resolves.toEqual({
        items: [
          expect.objectContaining({
            path: '/path/to/missing',
          }),
        ],
        nextCursor: undefined,
      });
    });
  });

  describe('handleMissingRefresh', () => {
    it('should succeed', async () => {
      const { sut } = setup();
      await expect(sut.handleMissingRefresh({ items: [] })).resolves.toBe(JobStatus.Success);
    });

    it('should remove outdated reports', async () => {
      const { sut, ctx } = setup();
      const integrity = ctx.get(IntegrityRepository);
      const storage = ctx.getMock(StorageRepository);

      const { id: restoredId } = await integrity.create({
        type: IntegrityReport.MissingFile,
        path: '/path/to/restored',
      });

      storage.stat
        .mockResolvedValueOnce({} as never)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce({} as never);

      await sut.handleMissingRefresh({
        items: [
          { path: '/path/to/existing', reportId: null },
          { path: '/path/to/missing', reportId: null },
          { path: '/path/to/restored', reportId: restoredId },
        ],
      });

      await expect(
        ctx.get(IntegrityRepository).getIntegrityReport(
          {
            limit: 100,
          },
          IntegrityReport.MissingFile,
        ),
      ).resolves.toEqual({
        items: [],
        nextCursor: undefined,
      });
    });
  });

  describe('handleChecksumFiles', () => {
    it('should succeed', async () => {
      const { sut } = setup();
      await expect(sut.handleChecksumFiles({ refreshOnly: false })).resolves.toBe(JobStatus.Success);
    });

    it('should queue refresh jobs when refreshOnly', async () => {
      const { sut, ctx } = setup();
      const job = ctx.getMock(JobRepository);
      job.queue.mockResolvedValue(void 0);

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const {
        result: { id: assetId },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file1', checksum: Buffer.from('a') });

      const { id: reportId } = await ctx.get(IntegrityRepository).create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/file1',
        assetId,
      });

      await sut.handleChecksumFiles({ refreshOnly: true });

      expect(job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityChecksumFilesRefresh,
        data: {
          items: [{ reportId, path: '/path/to/file1', checksum: '61' }],
        },
      });
    });

    it('should create report for checksum mismatch and delete when fixed', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const job = ctx.getMock(JobRepository);
      job.queue.mockResolvedValue(void 0);

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const {
        result: { id: assetId },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file1', checksum: Buffer.from('mismatched') });

      const fileContent1 = Buffer.from('test content');
      await ctx.newAsset({
        ownerId,
        originalPath: '/path/to/file2',
        checksum: createHash('sha1').update(fileContent1).digest(),
      });

      const fileContent2 = Buffer.from('test content 2');
      const {
        result: { id: assetId3 },
      } = await ctx.newAsset({
        ownerId,
        originalPath: '/path/to/file3',
        checksum: createHash('sha1').update(fileContent2).digest(),
      });

      await ctx.get(IntegrityRepository).create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/file3',
        assetId: assetId3,
      });

      storage.createPlainReadStream.mockImplementation((path) =>
        Readable.from(
          path === '/path/to/file2' ? fileContent1 : path === '/path/to/file3' ? fileContent2 : 'garbage data',
        ),
      );

      await sut.handleChecksumFiles({ refreshOnly: false });

      await expect(
        ctx.get(IntegrityRepository).getIntegrityReport(
          {
            limit: 100,
          },
          IntegrityReport.ChecksumFail,
        ),
      ).resolves.toEqual({
        items: [
          expect.objectContaining({
            assetId,
            path: '/path/to/file1',
          }),
        ],
        nextCursor: undefined,
      });
    });

    it('should skip missing files', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const job = ctx.getMock(JobRepository);
      job.queue.mockResolvedValue(void 0);

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      await ctx.newAsset({ ownerId, originalPath: '/path/to/file1', checksum: Buffer.from('a') });

      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      storage.createPlainReadStream.mockImplementation(() => {
        throw error;
      });

      await sut.handleChecksumFiles({ refreshOnly: false });

      await expect(
        ctx.get(IntegrityRepository).getIntegrityReport(
          {
            limit: 100,
          },
          IntegrityReport.ChecksumFail,
        ),
      ).resolves.toEqual({
        items: [],
        nextCursor: undefined,
      });
    });

    it('should skip external library files', async () => {
      const { sut, ctx } = setup();
      const job = ctx.getMock(JobRepository);
      job.queue.mockResolvedValue(void 0);

      const { user } = await ctx.newUser();

      await ctx.newAsset({ ownerId: user.id, isExternal: true });

      await sut.handleChecksumFiles({ refreshOnly: false });

      await expect(
        ctx.get(IntegrityRepository).getIntegrityReport({ limit: 100 }, IntegrityReport.ChecksumFail),
      ).resolves.toEqual({ items: [], nextCursor: undefined });
    });

    it('should continue from checkpoint', async () => {
      const { sut, ctx } = setup();
      const job = ctx.getMock(JobRepository);
      job.queue.mockResolvedValue();

      const { user } = await ctx.newUser();

      await ctx.newAsset({
        ownerId: user.id,
        createdAt: DateTime.now().minus({ days: 1 }).toISO(),
        originalPath: '/foo/bar',
      });
      await ctx.newAsset({ ownerId: user.id, originalPath: '/foo/baz' });

      await ctx
        .get(SystemMetadataRepository)
        .set(SystemMetadataKey.IntegrityChecksumCheckpoint, { date: DateTime.now().minus({ minutes: 5 }).toISO() });

      await sut.handleChecksumFiles({ refreshOnly: false });

      expect(ctx.getMock(StorageRepository).createPlainReadStream).not.toHaveBeenCalledWith('/foo/bar');
      expect(ctx.getMock(StorageRepository).createPlainReadStream).toHaveBeenCalledWith('/foo/baz');
    });
  });

  describe('handleChecksumRefresh', () => {
    it('should succeed', async () => {
      const { sut } = setup();
      await expect(sut.handleChecksumRefresh({ items: [] })).resolves.toBe(JobStatus.Success);
    });

    it('should delete reports when checksum now matches, file is missing, or asset is now missing', async () => {
      const { sut, ctx } = setup();
      const integrity = ctx.get(IntegrityRepository);
      const storage = ctx.getMock(StorageRepository);
      const job = ctx.getMock(JobRepository);
      job.queue.mockResolvedValue(void 0);

      const fileContent = Buffer.from('test content');
      const correctChecksum = createHash('sha1').update(fileContent).digest();

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const {
        result: { id: fixedAssetId },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/fixed', checksum: correctChecksum });

      const { id: fixedReportId } = await integrity.create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/fixed',
        assetId: fixedAssetId,
      });

      const {
        result: { id: missingAssetId },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/missing', checksum: Buffer.from('1') });

      const { id: missingReportId } = await integrity.create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/missing',
        assetId: missingAssetId,
      });

      const {
        result: { id: badAssetId },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/missing', checksum: Buffer.from('2') });

      const { id: badReportId } = await integrity.create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/bad',
        assetId: badAssetId,
      });

      const { id: missingAssetReportId } = await integrity.create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/missing-asset',
      });

      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';

      storage.createPlainReadStream
        .mockImplementationOnce(() => Readable.from(fileContent))
        .mockImplementationOnce(() => {
          throw error;
        })
        .mockImplementationOnce(() => Readable.from(fileContent))
        .mockImplementationOnce(() => Readable.from(fileContent));

      await sut.handleChecksumRefresh({
        items: [
          { reportId: fixedReportId, path: '/path/to/fixed', checksum: correctChecksum.toString('hex') },
          { reportId: missingReportId, path: '/path/to/missing', checksum: 'abc123' },
          { reportId: badReportId, path: '/path/to/bad', checksum: 'wrongchecksum' },
          { reportId: missingAssetReportId, path: '/path/to/missing-asset', checksum: null },
        ],
      });

      await expect(
        ctx.get(IntegrityRepository).getIntegrityReport(
          {
            limit: 100,
          },
          IntegrityReport.ChecksumFail,
        ),
      ).resolves.toEqual({
        items: [
          expect.objectContaining({
            id: badReportId,
            assetId: badAssetId,
            path: '/path/to/bad',
          }),
        ],
        nextCursor: undefined,
      });
    });
  });

  describe('handleDeleteAllIntegrityReports', () => {
    it('should succeed', async () => {
      const { sut } = setup();
      await expect(sut.handleDeleteAllIntegrityReports({})).resolves.toBe(JobStatus.Success);
    });

    it('should queue delete jobs for checksum fail reports', async () => {
      const { sut, ctx } = setup();
      const integrity = ctx.get(IntegrityRepository);
      const job = ctx.getMock(JobRepository);
      job.queue.mockResolvedValue(void 0);

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const {
        result: { id: assetId },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file1' });

      const { id: reportId } = await integrity.create({
        type: IntegrityReport.ChecksumFail,
        path: '/path/to/file1',
        assetId,
      });

      await sut.handleDeleteAllIntegrityReports({ type: IntegrityReport.ChecksumFail });

      expect(job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityDeleteReports,
        data: {
          reports: [{ id: reportId, assetId, path: '/path/to/file1', fileAssetId: null }],
        },
      });
    });

    it('should queue delete jobs for missing file reports by assetId and fileAssetId', async () => {
      const { sut, ctx } = setup();
      const integrity = ctx.get(IntegrityRepository);
      const job = ctx.getMock(JobRepository);
      job.queue.mockResolvedValue(void 0);

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const {
        result: { id: assetId },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file1' });

      const { id: assetReportId } = await integrity.create({
        type: IntegrityReport.MissingFile,
        path: '/path/to/file1',
        assetId,
      });

      const {
        result: { id: assetId2 },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file2' });

      const fileAssetId = randomUUID();
      await ctx.newAssetFile({
        id: fileAssetId,
        assetId: assetId2,
        path: '/path/to/file3',
        type: AssetFileType.Thumbnail,
      });

      const { id: fileAssetReportId } = await integrity.create({
        type: IntegrityReport.MissingFile,
        path: '/path/to/file3',
        fileAssetId,
      });

      await sut.handleDeleteAllIntegrityReports({ type: IntegrityReport.MissingFile });

      expect(job.queue).toHaveBeenCalledTimes(2);

      expect(job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityDeleteReports,
        data: {
          reports: [{ id: assetReportId, assetId, path: '/path/to/file1', fileAssetId: null }],
        },
      });

      expect(job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityDeleteReports,
        data: {
          reports: [{ id: fileAssetReportId, assetId: null, path: '/path/to/file3', fileAssetId }],
        },
      });
    });

    it('should queue delete jobs for untracked file reports', async () => {
      const { sut, ctx } = setup();
      const integrity = ctx.get(IntegrityRepository);
      const job = ctx.getMock(JobRepository);
      job.queue.mockResolvedValue(void 0);

      const { id: reportId } = await integrity.create({
        type: IntegrityReport.UntrackedFile,
        path: '/path/to/untracked',
      });

      await sut.handleDeleteAllIntegrityReports({ type: IntegrityReport.UntrackedFile });

      expect(job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityDeleteReports,
        data: {
          reports: [{ id: reportId, path: '/path/to/untracked', assetId: null, fileAssetId: null }],
        },
      });
    });
  });

  describe('handleDeleteIntegrityReports', () => {
    it('should succeed', async () => {
      const { sut } = setup();
      await expect(sut.handleDeleteIntegrityReports({ reports: [] })).resolves.toBe(JobStatus.Success);
    });

    it('should handle all report types', async () => {
      const { sut, ctx } = setup();
      const integrity = ctx.get(IntegrityRepository);
      const storage = ctx.getMock(StorageRepository);
      const events = ctx.getMock(EventRepository);

      storage.unlink.mockResolvedValue(void 0);
      events.emit.mockResolvedValue(void 0);

      const {
        result: { id: ownerId },
      } = await ctx.newUser();

      const {
        result: { id: assetId1 },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file1' });

      const { id: reportId1 } = await integrity.create({
        path: '/path/to/file1',
        type: IntegrityReport.ChecksumFail,
        assetId: assetId1,
      });

      const {
        result: { id: assetId2 },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file2' });

      const { id: reportId2 } = await integrity.create({
        path: '/path/to/file2',
        type: IntegrityReport.MissingFile,
        assetId: assetId2,
      });

      const {
        result: { id: assetId3 },
      } = await ctx.newAsset({ ownerId, originalPath: '/path/to/file3' });

      const fileAssetId = randomUUID();
      await ctx.newAssetFile({
        id: fileAssetId,
        assetId: assetId3,
        path: '/path/to/file4',
        type: AssetFileType.Thumbnail,
      });

      const { id: reportId3 } = await integrity.create({
        path: '/path/to/file4',
        type: IntegrityReport.MissingFile,
        fileAssetId,
      });

      const { id: reportId4 } = await integrity.create({
        path: '/path/to/untracked',
        type: IntegrityReport.UntrackedFile,
      });

      await sut.handleDeleteIntegrityReports({
        reports: [
          { id: reportId1, assetId: assetId1, fileAssetId: null, path: '/path/to/file1' },
          { id: reportId2, assetId: assetId2, fileAssetId: null, path: '/path/to/file2' },
          { id: reportId3, assetId: null, fileAssetId, path: '/path/to/file4' },
          { id: reportId4, assetId: null, fileAssetId: null, path: '/path/to/untracked' },
        ],
      });

      expect(events.emit).toHaveBeenCalledWith('AssetTrashAll', {
        assetIds: [assetId1, assetId2],
        userId: '',
      });

      expect(storage.unlink).toHaveBeenCalledWith('/path/to/untracked');

      await expect(ctx.get(AssetRepository).getByIds([assetId1, assetId2, assetId3])).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: assetId1,
            status: 'trashed',
          }),
          expect.objectContaining({
            id: assetId2,
            status: 'trashed',
          }),
          expect.objectContaining({
            id: assetId3,
            status: 'active',
          }),
        ]),
      );

      await expect(defaultDatabase.selectFrom('asset_file').execute()).resolves.toEqual([]);
      await expect(defaultDatabase.selectFrom('integrity_report').execute()).resolves.toEqual([]);
    });
  });
});
