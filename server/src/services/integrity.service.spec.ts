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

  describe.todo('handleChecksumFiles');
  describe.todo('handleChecksumRefresh');
  describe.todo('handleDeleteIntegrityReport');
});
