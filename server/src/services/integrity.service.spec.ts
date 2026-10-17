import { IntegrityReport, JobName } from 'src/enum.js';
import { IntegrityService } from 'src/services/integrity.service.js';
import { ServiceMocks, newTestService } from 'test/utils.js';

describe(IntegrityService.name, () => {
  let sut: IntegrityService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(IntegrityService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleUntrackedFiles', () => {
    const decomposedPath = '/data/upload/upload/user-id/Cafe\u{301}.jpg';
    const composedPath = '/data/upload/upload/user-id/Caf\u{E9}.jpg';

    beforeEach(() => {
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getPersonThumbnailPathsByPaths.mockResolvedValue([]);
    });

    it.each([
      { scannedPath: decomposedPath, storedPath: composedPath },
      { scannedPath: composedPath, storedPath: decomposedPath },
    ])(
      'should not report a tracked asset whose path differs only by unicode normalization',
      async ({ scannedPath, storedPath }) => {
        mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([
          { originalPath: storedPath, encodedVideoPath: null },
        ]);

        await sut.handleUntrackedFiles({ type: 'asset', paths: [scannedPath] });

        expect(mocks.integrityReport.getAssetPathsByPaths).toHaveBeenCalledWith(
          expect.arrayContaining([decomposedPath, composedPath]),
        );
        expect(mocks.integrityReport.create).not.toHaveBeenCalled();
      },
    );

    it('should not queue a notification from a batch (notification is queued when the scan finishes)', async () => {
      await sut.handleUntrackedFiles({ type: 'asset', paths: ['/data/upload/orphan.mov'] });

      expect(mocks.integrityReport.create).toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });
  });

  describe('handleUntrackedFilesQueueAll', () => {
    it('should queue an integrity error notification after all scan jobs', async () => {
      mocks.integrityReport.streamIntegrityReportsWithAssetChecksum.mockReturnValue(
        (async function* () {})() as never,
      );
      mocks.storage.walk
        .mockReturnValueOnce((async function* () { yield ['/a']; })() as never)
        .mockReturnValueOnce((async function* () { yield ['/b']; })() as never);

      await sut.handleUntrackedFilesQueueAll({});

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityUntrackedFiles,
        data: { type: 'asset', paths: ['/a'] },
      });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityUntrackedFiles,
        data: { type: 'asset_file', paths: ['/b'] },
      });
      expect(mocks.job.queue).toHaveBeenLastCalledWith({
        name: JobName.NotifyIntegrityErrors,
        data: { type: IntegrityReport.UntrackedFile },
      });
    });

    it('should not queue a notification for refresh-only runs', async () => {
      mocks.integrityReport.streamIntegrityReportsWithAssetChecksum.mockReturnValue(
        (async function* () { yield { reportId: 'report-id', path: '/a' }; })() as never,
      );

      await sut.handleUntrackedFilesQueueAll({ refreshOnly: true });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityUntrackedFilesRefresh,
        data: { items: [{ reportId: 'report-id', path: '/a' }] },
      });
      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.NotifyIntegrityErrors }),
      );
    });
  });

  describe('handleMissingFilesQueueAll', () => {
    it('should queue an integrity error notification after all scan jobs', async () => {
      mocks.integrityReport.streamAssetPathsForMissingFiles.mockReturnValue(
        (async function* () {
          yield { path: '/a', assetId: 'asset-id', fileAssetId: null, reportId: null };
        })() as never,
      );

      await sut.handleMissingFilesQueueAll({});

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityMissingFiles,
        data: {
          items: [{ path: '/a', assetId: 'asset-id', fileAssetId: null, reportId: null }],
        },
      });
      expect(mocks.job.queue).toHaveBeenLastCalledWith({
        name: JobName.NotifyIntegrityErrors,
        data: { type: IntegrityReport.MissingFile },
      });
    });
  });

  describe('handleMissingFiles', () => {
    it('should not queue a notification from a batch (notification is queued when the scan finishes)', async () => {
      mocks.storage.stat.mockRejectedValueOnce(new Error('missing'));

      await sut.handleMissingFiles({
        items: [{ path: '/data/upload/missing.mov', assetId: 'asset-id', fileAssetId: null, reportId: null }],
      });

      expect(mocks.integrityReport.create).toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });
  });

  describe('handleChecksumFiles', () => {
    it('should queue refresh jobs without a notification when refreshOnly is set', async () => {
      mocks.integrityReport.streamIntegrityReportsWithAssetChecksum.mockReturnValue(
        (async function* () {
          yield { reportId: 'report-id', path: '/a', checksum: Buffer.from('aa') };
        })() as never,
      );

      await sut.handleChecksumFiles({ refreshOnly: true });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.IntegrityChecksumFilesRefresh,
        data: { items: [{ path: '/a', reportId: 'report-id', checksum: '6161' }] },
      });
      expect(mocks.job.queue).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: JobName.NotifyIntegrityErrors }),
      );
    });
  });

  describe('handleUntrackedRefresh', () => {
    beforeEach(() => {
      mocks.integrityReport.getTrackedPaths.mockResolvedValue([]);
    });

    it('should delete a report whose path is now referenced by an asset', async () => {
      const path = '/data/upload/admin/ab/asset.mov';
      mocks.integrityReport.getTrackedPaths.mockResolvedValue([{ path }] as never);

      await sut.handleUntrackedRefresh({ items: [{ reportId: 'report-id', path }] });

      expect(mocks.integrityReport.deleteByIds).toHaveBeenCalledWith(['report-id']);
      expect(mocks.storage.stat).not.toHaveBeenCalled();
    });

    it('should keep a report whose path is still untracked and present on disk', async () => {
      mocks.storage.stat.mockResolvedValue({} as never);

      await sut.handleUntrackedRefresh({ items: [{ reportId: 'report-id', path: '/data/upload/orphan.mov' }] });

      expect(mocks.integrityReport.deleteByIds).not.toHaveBeenCalled();
    });

    it('should not query for references when the batch is empty', async () => {
      await sut.handleUntrackedRefresh({ items: [] });

      expect(mocks.integrityReport.getTrackedPaths).not.toHaveBeenCalled();
      expect(mocks.integrityReport.deleteByIds).not.toHaveBeenCalled();
    });
  });

  describe('deleteIntegrityReport', () => {
    it('should not unlink a path that is now tracked', async () => {
      const path = '/data/upload/admin/ab/asset.mov';
      mocks.integrityReport.getById.mockResolvedValue({ path } as never);
      mocks.integrityReport.getTrackedPaths.mockResolvedValue([{ path }] as never);

      await sut.deleteIntegrityReport('user-id', 'report-id');

      expect(mocks.storage.unlink).not.toHaveBeenCalled();
      expect(mocks.integrityReport.deleteById).toHaveBeenCalledWith('report-id');
    });
  });

  describe('handleDeleteIntegrityReports', () => {
    it('should unlink only paths that are still untracked', async () => {
      const tracked = '/data/upload/admin/ab/asset.mov';
      const untracked = '/data/upload/orphan.mov';
      mocks.integrityReport.getTrackedPaths.mockResolvedValue([{ path: tracked }] as never);
      mocks.storage.unlink.mockResolvedValue();

      await sut.handleDeleteIntegrityReports({
        reports: [
          { id: 'tracked-report', path: tracked },
          { id: 'untracked-report', path: untracked },
        ] as never,
      });

      expect(mocks.storage.unlink).toHaveBeenCalledExactlyOnceWith(untracked);
      expect(mocks.integrityReport.deleteByIds).toHaveBeenCalledWith(['tracked-report', 'untracked-report']);
    });
  });

  describe('handleDeleteAllIntegrityReports', () => {
    beforeEach(() => {
      mocks.integrityReport.streamIntegrityReportsByProperty.mockReturnValue((function* () {})() as never);
    });

    it('should query all property types when no type specified', async () => {
      await sut.handleDeleteAllIntegrityReports({});

      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith(undefined, undefined);
      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith('assetId', undefined);
      expect(mocks.integrityReport.streamIntegrityReportsByProperty).toHaveBeenCalledWith('fileAssetId', undefined);
    });
  });
});
