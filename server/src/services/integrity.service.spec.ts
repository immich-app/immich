import { text } from 'node:stream/consumers';
import { AssetStatus, IntegrityReportType, JobName } from 'src/enum';
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
      await expect(sut.getIntegrityReport(IntegrityReportType.ChecksumFail)).resolves.toEqual(
        expect.objectContaining({
          items: undefined,
        }),
      );

      expect(mocks.integrityReport.getIntegrityReports).toHaveBeenCalledWith(IntegrityReportType.ChecksumFail);
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
    it('queues jobs for all detected files', async () => {
      mocks.integrityReport.streamIntegrityReportsWithAssetChecksum.mockReturnValue((function* () {})() as never);
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
  });

  describe.todo('handleOrphanedFiles');
  describe.todo('handleOrphanedRefresh');
  describe.todo('handleMissingFilesQueueAll');
  describe.todo('handleMissingFiles');
  describe.todo('handleMissingRefresh');
  describe.todo('handleChecksumFiles');
  describe.todo('handleChecksumRefresh');
  describe.todo('handleDeleteIntegrityReport');
});
