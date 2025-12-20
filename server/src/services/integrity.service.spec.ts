import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { AssetStatus, IntegrityReportType, JobName, JobStatus } from 'src/enum';
import { IntegrityService } from 'src/services/integrity.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(IntegrityService.name, () => {
  let sut: IntegrityService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(IntegrityService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getIntegrityReportSummary', () => {
    it('gets summary', async () => {
      await sut.getIntegrityReportSummary();
      expect(mocks.integrityReport.getIntegrityReportSummary).toHaveBeenCalled();
    });
  });

  describe('getIntegrityReport', () => {
    it('gets report', async () => {
      mocks.integrityReport.getIntegrityReports.mockResolvedValue({
        items: [],
        hasNextPage: false,
      });

      await expect(sut.getIntegrityReport({ type: IntegrityReportType.ChecksumFail })).resolves.toEqual({
        items: [],
        hasNextPage: false,
      });

      expect(mocks.integrityReport.getIntegrityReports).toHaveBeenCalledWith(
        { page: 1, size: 100 },
        IntegrityReportType.ChecksumFail,
      );
    });
  });

  describe('getIntegrityReportCsv', () => {
    it('gets report as csv', async () => {
      mocks.integrityReport.streamIntegrityReports.mockReturnValue(
        (function* () {
          yield {
            id: 'id',
            createdAt: new Date(0),
            path: '/path/to/file',
            type: IntegrityReportType.ChecksumFail,
            assetId: null,
            fileAssetId: null,
          };
        })() as never,
      );

      await expect(text(sut.getIntegrityReportCsv(IntegrityReportType.ChecksumFail))).resolves.toMatchInlineSnapshot(`
        "id,type,assetId,fileAssetId,path
        id,checksum_mismatch,null,null,"/path/to/file"
        "
      `);

      expect(mocks.integrityReport.streamIntegrityReports).toHaveBeenCalledWith(IntegrityReportType.ChecksumFail);
    });
  });

  describe('getIntegrityReportFile', () => {
    it('gets report file', async () => {
      mocks.integrityReport.getById.mockResolvedValue({
        id: 'id',
        createdAt: new Date(0),
        path: '/path/to/file',
        type: IntegrityReportType.ChecksumFail,
        assetId: null,
        fileAssetId: null,
      });

      await expect(sut.getIntegrityReportFile('id')).resolves.toEqual({
        path: '/path/to/file',
        fileName: 'file',
        contentType: 'application/octet-stream',
        cacheControl: 'private_without_cache',
      });

      expect(mocks.integrityReport.getById).toHaveBeenCalledWith('id');
    });
  });

  describe('deleteIntegrityReport', () => {
    it('deletes asset if one is present', async () => {
      mocks.integrityReport.getById.mockResolvedValue({
        id: 'id',
        createdAt: new Date(0),
        path: '/path/to/file',
        type: IntegrityReportType.ChecksumFail,
        assetId: 'assetId',
        fileAssetId: null,
      });

      await sut.deleteIntegrityReport(
        {
          user: {
            id: 'userId',
          },
        } as never,
        'id',
      );

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['assetId'], {
        deletedAt: expect.any(Date),
        status: AssetStatus.Trashed,
      });

      expect(mocks.event.emit).toHaveBeenCalledWith('AssetTrashAll', {
        assetIds: ['assetId'],
        userId: 'userId',
      });

      expect(mocks.integrityReport.deleteById).toHaveBeenCalledWith('id');
    });

    it('deletes file asset if one is present', async () => {
      mocks.integrityReport.getById.mockResolvedValue({
        id: 'id',
        createdAt: new Date(0),
        path: '/path/to/file',
        type: IntegrityReportType.ChecksumFail,
        assetId: null,
        fileAssetId: 'fileAssetId',
      });

      await sut.deleteIntegrityReport(
        {
          user: {
            id: 'userId',
          },
        } as never,
        'id',
      );

      expect(mocks.asset.deleteFiles).toHaveBeenCalledWith([{ id: 'fileAssetId' }]);
    });

    it('deletes orphaned file', async () => {
      mocks.integrityReport.getById.mockResolvedValue({
        id: 'id',
        createdAt: new Date(0),
        path: '/path/to/file',
        type: IntegrityReportType.ChecksumFail,
        assetId: null,
        fileAssetId: null,
      });

      await sut.deleteIntegrityReport(
        {
          user: {
            id: 'userId',
          },
        } as never,
        'id',
      );

      expect(mocks.storage.unlink).toHaveBeenCalledWith('/path/to/file');
      expect(mocks.integrityReport.deleteById).toHaveBeenCalledWith('id');
    });
  });

  describe('handleOrphanedFilesQueueAll', () => {
    beforeEach(() => {
      mocks.integrityReport.streamIntegrityReportsWithAssetChecksum.mockReturnValue((function* () {})() as never);
    });

    it('queues jobs for all detected files', async () => {
      mocks.storage.walk.mockReturnValueOnce(
        (function* () {
          yield ['/path/to/file', '/path/to/file2'];
          yield ['/path/to/batch2'];
        })() as never,
      );

      mocks.storage.walk.mockReturnValueOnce(
        (function* () {
          yield ['/path/to/file3', '/path/to/file4'];
          yield ['/path/to/batch4'];
        })() as never,
      );

      await sut.handleOrphanedFilesQueueAll({ refreshOnly: false });

      expect(mocks.job.queue).toBeCalledTimes(4);
      expect(mocks.job.queue).toBeCalledWith({
        name: JobName.IntegrityOrphanedFiles,
        data: {
          type: 'asset',
          paths: expect.arrayContaining(['/path/to/file']),
        },
      });

      expect(mocks.job.queue).toBeCalledWith({
        name: JobName.IntegrityOrphanedFiles,
        data: {
          type: 'asset_file',
          paths: expect.arrayContaining(['/path/to/file3']),
        },
      });
    });

    it('queues jobs to refresh reports', async () => {
      mocks.integrityReport.streamIntegrityReportsWithAssetChecksum.mockReturnValue(
        (function* () {
          yield 'mockReport';
        })() as never,
      );

      await sut.handleOrphanedFilesQueueAll({ refreshOnly: false });

      expect(mocks.job.queue).toBeCalledTimes(1);
      expect(mocks.job.queue).toBeCalledWith({
        name: JobName.IntegrityOrphanedFilesRefresh,
        data: {
          items: expect.arrayContaining(['mockReport']),
        },
      });
    });

    it('should succeed', async () => {
      await expect(sut.handleOrphanedFilesQueueAll({ refreshOnly: false })).resolves.toBe(JobStatus.Success);
    });
  });

  describe('handleOrphanedFiles', () => {
    it('should detect orphaned asset files', async () => {
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([
        { originalPath: '/path/to/file1', encodedVideoPath: null },
      ]);

      await sut.handleOrphanedFiles({
        type: 'asset',
        paths: ['/path/to/file1', '/path/to/orphan'],
      });

      expect(mocks.integrityReport.getAssetPathsByPaths).toHaveBeenCalledWith(['/path/to/file1', '/path/to/orphan']);
      expect(mocks.integrityReport.create).toHaveBeenCalledWith([
        { type: IntegrityReportType.OrphanFile, path: '/path/to/orphan' },
      ]);
    });

    it('should not create reports when no orphans found for assets', async () => {
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([
        { originalPath: '/path/to/file1', encodedVideoPath: '/path/to/encoded' },
      ]);

      await sut.handleOrphanedFiles({
        type: 'asset',
        paths: ['/path/to/file1', '/path/to/encoded'],
      });

      expect(mocks.integrityReport.create).not.toHaveBeenCalled();
    });

    it('should detect orphaned asset_file files', async () => {
      mocks.integrityReport.getAssetFilePathsByPaths.mockResolvedValue([{ path: '/path/to/thumb1' }]);

      await sut.handleOrphanedFiles({
        type: 'asset_file',
        paths: ['/path/to/thumb1', '/path/to/orphan_thumb'],
      });

      expect(mocks.integrityReport.create).toHaveBeenCalledWith([
        { type: IntegrityReportType.OrphanFile, path: '/path/to/orphan_thumb' },
      ]);
    });
  });

  describe('handleOrphanedRefresh', () => {
    it('should delete reports for files that no longer exist', async () => {
      mocks.storage.stat
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce({} as never)
        .mockRejectedValueOnce(new Error('ENOENT'));

      await sut.handleOrphanedRefresh({
        items: [
          { reportId: 'report1', path: '/path/to/missing1' },
          { reportId: 'report2', path: '/path/to/existing' },
          { reportId: 'report3', path: '/path/to/missing2' },
        ],
      });

      expect(mocks.integrityReport.deleteByIds).toHaveBeenCalledWith(['report1', 'report3']);
    });

    it('should not delete reports for files that still exist', async () => {
      mocks.storage.stat.mockResolvedValue({} as never);

      await sut.handleOrphanedRefresh({
        items: [{ reportId: 'report1', path: '/path/to/existing' }],
      });

      expect(mocks.integrityReport.deleteByIds).not.toHaveBeenCalled();
    });

    it('should succeed', async () => {
      await expect(sut.handleOrphanedRefresh({ items: [] })).resolves.toBe(JobStatus.Success);
    });
  });

  describe('handleMissingFilesQueueAll', () => {
    beforeEach(() => {
      mocks.integrityReport.streamAssetPaths.mockReturnValue((function* () {})() as never);
    });

    it('should queue jobs', async () => {
      mocks.integrityReport.streamAssetPaths.mockReturnValue(
        (function* () {
          yield { path: '/path/to/file1', assetId: 'asset1', fileAssetId: null };
          yield { path: '/path/to/file2', assetId: 'asset2', fileAssetId: null };
        })() as never,
      );

      await sut.handleMissingFilesQueueAll({ refreshOnly: false });

      expect(mocks.integrityReport.streamAssetPaths).toHaveBeenCalled();

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityMissingFiles,
        data: {
          items: expect.arrayContaining([{ path: '/path/to/file1', assetId: 'asset1', fileAssetId: null }]),
        },
      });

      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({
          name: JobName.IntegrityMissingFilesRefresh,
        }),
      );
    });

    it('should queue refresh jobs when refreshOnly is set', async () => {
      mocks.integrityReport.streamIntegrityReportsWithAssetChecksum.mockReturnValue(
        (function* () {
          yield { reportId: 'report1', path: '/path/to/file1' };
          yield { reportId: 'report2', path: '/path/to/file2' };
        })() as never,
      );

      await sut.handleMissingFilesQueueAll({ refreshOnly: true });

      expect(mocks.integrityReport.streamIntegrityReportsWithAssetChecksum).toHaveBeenCalledWith(
        IntegrityReportType.MissingFile,
      );

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityMissingFilesRefresh,
        data: {
          items: expect.arrayContaining([{ reportId: 'report1', path: '/path/to/file1' }]),
        },
      });

      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({
          name: JobName.IntegrityMissingFiles,
        }),
      );
    });

    it('should succeed', async () => {
      await expect(sut.handleMissingFilesQueueAll()).resolves.toBe(JobStatus.Success);
    });
  });

  describe('handleMissingFiles', () => {
    it('should detect missing files and remove outdated reports', async () => {
      mocks.storage.stat
        .mockResolvedValueOnce({} as never)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce({} as never);

      await sut.handleMissingFiles({
        items: [
          { path: '/path/to/existing', assetId: 'asset1', fileAssetId: null, reportId: null },
          { path: '/path/to/missing', assetId: 'asset2', fileAssetId: null, reportId: null },
          { path: '/path/to/restored', assetId: 'asset3', fileAssetId: null, reportId: 'report2' },
        ],
      });

      expect(mocks.integrityReport.deleteByIds).toHaveBeenCalledWith(['report2']);
      expect(mocks.integrityReport.create).toHaveBeenCalledWith([
        { type: IntegrityReportType.MissingFile, path: '/path/to/missing', assetId: 'asset2', fileAssetId: null },
      ]);
    });

    it('should succeed', async () => {
      await expect(sut.handleMissingFiles({ items: [] })).resolves.toBe(JobStatus.Success);
    });
  });

  describe('handleMissingRefresh', () => {
    it('should remove outdated reports', async () => {
      mocks.storage.stat
        .mockResolvedValueOnce({} as never)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce({} as never);

      await sut.handleMissingRefresh({
        items: [
          { path: '/path/to/existing', reportId: null },
          { path: '/path/to/missing', reportId: null },
          { path: '/path/to/restored', reportId: 'report2' },
        ],
      });

      expect(mocks.integrityReport.deleteByIds).toHaveBeenCalledWith(['report2']);
    });

    it('should succeed', async () => {
      await expect(sut.handleMissingFiles({ items: [] })).resolves.toBe(JobStatus.Success);
    });
  });

  describe('handleChecksumFiles', () => {
    beforeEach(() => {
      mocks.integrityReport.streamIntegrityReportsWithAssetChecksum.mockReturnValue((function* () {})() as never);
      mocks.integrityReport.streamAssetChecksums.mockReturnValue((function* () {})() as never);
      mocks.integrityReport.getAssetCount.mockResolvedValue({ count: 1000 });
      mocks.systemMetadata.get.mockResolvedValue(null);
    });

    it('should queue refresh jobs when refreshOnly', async () => {
      mocks.integrityReport.streamIntegrityReportsWithAssetChecksum.mockReturnValue(
        (function* () {
          yield { reportId: 'report1', path: '/path/to/file1', checksum: Buffer.from('abc123', 'hex') };
        })() as never,
      );

      await sut.handleChecksumFiles({ refreshOnly: true });

      expect(mocks.integrityReport.streamIntegrityReportsWithAssetChecksum).toHaveBeenCalledWith(
        IntegrityReportType.ChecksumFail,
      );

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityChecksumFilesRefresh,
        data: {
          items: [{ reportId: 'report1', path: '/path/to/file1', checksum: 'abc123' }],
        },
      });
    });

    it('should create report for checksum mismatch and delete when fixed', async () => {
      const fileContent = Buffer.from('test content');

      mocks.integrityReport.streamAssetChecksums.mockReturnValue(
        (function* () {
          yield {
            originalPath: '/path/to/mismatch',
            checksum: 'mismatched checksum',
            createdAt: new Date(),
            assetId: 'asset1',
            reportId: null,
          };
          yield {
            originalPath: '/path/to/fixed',
            checksum: createHash('sha1').update(fileContent).digest(),
            createdAt: new Date(),
            assetId: 'asset2',
            reportId: 'report1',
          };
        })() as never,
      );

      mocks.storage.createPlainReadStream.mockImplementation(() => Readable.from(fileContent));

      await sut.handleChecksumFiles({ refreshOnly: false });

      expect(mocks.integrityReport.create).toHaveBeenCalledWith({
        path: '/path/to/mismatch',
        type: IntegrityReportType.ChecksumFail,
        assetId: 'asset1',
      });

      expect(mocks.integrityReport.deleteById).toHaveBeenCalledWith('report1');
    });

    it('should skip missing files', async () => {
      mocks.integrityReport.streamAssetChecksums.mockReturnValue(
        (function* () {
          yield {
            originalPath: '/path/to/missing',
            checksum: Buffer.from('abc', 'hex'),
            createdAt: new Date(),
            assetId: 'asset1',
            reportId: 'report1',
          };
        })() as never,
      );

      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mocks.storage.createPlainReadStream.mockImplementation(() => {
        throw error;
      });

      await sut.handleChecksumFiles({ refreshOnly: false });

      expect(mocks.integrityReport.deleteById).toHaveBeenCalledWith('report1');
      expect(mocks.integrityReport.create).not.toHaveBeenCalled();
    });

    it('should succeed', async () => {
      await expect(sut.handleChecksumFiles({ refreshOnly: false })).resolves.toBe(JobStatus.Success);
    });
  });

  describe('handleChecksumRefresh', () => {
    it('should delete reports when checksum now matches, file is missing, or asset is now missing', async () => {
      const fileContent = Buffer.from('test content');
      const correctChecksum = createHash('sha1').update(fileContent).digest().toString('hex');

      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';

      mocks.storage.createPlainReadStream
        .mockImplementationOnce(() => Readable.from(fileContent))
        .mockImplementationOnce(() => {
          throw error;
        })
        .mockImplementationOnce(() => Readable.from(fileContent))
        .mockImplementationOnce(() => Readable.from(fileContent));

      await sut.handleChecksumRefresh({
        items: [
          { reportId: 'report1', path: '/path/to/fixed', checksum: correctChecksum },
          { reportId: 'report2', path: '/path/to/missing', checksum: 'abc123' },
          { reportId: 'report3', path: '/path/to/bad', checksum: 'wrongchecksum' },
          { reportId: 'report4', path: '/path/to/missing-asset', checksum: null },
        ],
      });

      expect(mocks.integrityReport.deleteByIds).toHaveBeenCalledWith(['report1', 'report2', 'report4']);
    });

    it('should succeed', async () => {
      await expect(sut.handleChecksumRefresh({ items: [] })).resolves.toBe(JobStatus.Success);
    });
  });

  describe('handleDeleteAllIntegrityReports', () => {
    beforeEach(() => {
      mocks.integrityReport.streamIntegrityReportsByProperty.mockReturnValue((function* () {})() as never);
    });

    it('should queue delete jobs for checksum fail reports', async () => {
      mocks.integrityReport.streamIntegrityReportsByProperty.mockReturnValue(
        (function* () {
          yield { id: 'report1', assetId: 'asset1', path: '/path/to/file1' };
        })() as never,
      );

      await sut.handleDeleteAllIntegrityReports({ type: IntegrityReportType.ChecksumFail });

      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith(
        'assetId',
        IntegrityReportType.ChecksumFail,
      );

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityDeleteReports,
        data: {
          reports: [{ id: 'report1', assetId: 'asset1', path: '/path/to/file1' }],
        },
      });
    });

    it('should queue delete jobs for missing file reports by assetId and fileAssetId', async () => {
      mocks.integrityReport.streamIntegrityReportsByProperty
        .mockReturnValueOnce(
          (function* () {
            yield { id: 'report1', assetId: 'asset1', path: '/path/to/file1' };
          })() as never,
        )
        .mockReturnValueOnce(
          (function* () {
            yield { id: 'report2', fileAssetId: 'fileAsset1', path: '/path/to/file2' };
          })() as never,
        );

      await sut.handleDeleteAllIntegrityReports({ type: IntegrityReportType.MissingFile });

      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith(
        'assetId',
        IntegrityReportType.MissingFile,
      );

      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith(
        'fileAssetId',
        IntegrityReportType.MissingFile,
      );

      expect(mocks.job.queue).toHaveBeenCalledTimes(2);
    });

    it('should queue delete jobs for orphan file reports', async () => {
      mocks.integrityReport.streamIntegrityReportsByProperty.mockReturnValue(
        (function* () {
          yield { id: 'report1', path: '/path/to/orphan' };
        })() as never,
      );

      await sut.handleDeleteAllIntegrityReports({ type: IntegrityReportType.OrphanFile });

      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith(
        undefined,
        IntegrityReportType.OrphanFile,
      );

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityDeleteReports,
        data: {
          reports: [{ id: 'report1', path: '/path/to/orphan' }],
        },
      });
    });

    it('should query all property types when no type specified', async () => {
      await sut.handleDeleteAllIntegrityReports({});

      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith(undefined, undefined);
      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith('assetId', undefined);
      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith('fileAssetId', undefined);
    });

    it('should succeed', async () => {
      await expect(sut.handleDeleteAllIntegrityReports({})).resolves.toBe(JobStatus.Success);
    });
  });

  describe('handleDeleteIntegrityReports', () => {
    it('should handle all report types', async () => {
      mocks.storage.unlink.mockResolvedValue(void 0);

      await sut.handleDeleteIntegrityReports({
        reports: [
          { id: 'report1', assetId: 'asset1', fileAssetId: null, path: '/path/to/file1' },
          { id: 'report2', assetId: 'asset2', fileAssetId: null, path: '/path/to/file2' },
          { id: 'report3', assetId: null, fileAssetId: 'fileAsset1', path: '/path/to/file3' },
          { id: 'report4', assetId: null, fileAssetId: null, path: '/path/to/orphan' },
        ],
      });

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['asset1', 'asset2'], {
        deletedAt: expect.any(Date),
        status: AssetStatus.Trashed,
      });

      expect(mocks.event.emit).toHaveBeenCalledWith('AssetTrashAll', {
        assetIds: ['asset1', 'asset2'],
        userId: '',
      });

      expect(mocks.integrityReport.deleteByIds).toHaveBeenCalledWith(['report1', 'report2']);

      expect(mocks.asset.deleteFiles).toHaveBeenCalledWith([{ id: 'fileAsset1' }]);

      expect(mocks.storage.unlink).toHaveBeenCalledWith('/path/to/orphan');
      expect(mocks.integrityReport.deleteByIds).toHaveBeenCalledWith(['report4']);
    });

    it('should succeed', async () => {
      await expect(sut.handleDeleteIntegrityReports({ reports: [] })).resolves.toBe(JobStatus.Success);
    });
  });
});
