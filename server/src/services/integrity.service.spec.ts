import { Resource } from 'src/resource-paths.js';
import { IntegrityService } from 'src/services/integrity.service.js';
import { AssetFactory } from 'test/factories/asset.factory.js';
import { getForAsset } from 'test/mappers.js';
import { mockAdmins } from 'test/repositories/user.repository.mock.js';
import { newUuid } from 'test/small.factory.js';
import { ServiceMocks, expectResourceEvents, newTestService } from 'test/utils.js';

describe(IntegrityService.name, () => {
  let sut: IntegrityService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(IntegrityService));
    mocks.user.getAdminIds.mockResolvedValue([]);
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

    it('should tell every admin when a file is deleted', async () => {
      const adminIds = mockAdmins(mocks.user);
      const id = newUuid();
      mocks.integrityReport.getById.mockResolvedValue({ id, path: '/data/upload/orphan.mov' } as never);
      mocks.integrityReport.getTrackedPaths.mockResolvedValue([]);

      await sut.deleteIntegrityReport(adminIds[0], id);

      expectResourceEvents(mocks, {
        userIds: adminIds,
        changed: [Resource.integrityReport(), Resource.integrityReportSummary()],
      });
    });

    it('should tell every admin and the asset owner when an asset is trashed', async () => {
      const adminIds = mockAdmins(mocks.user);
      const asset = AssetFactory.create();
      const id = newUuid();
      mocks.integrityReport.getById.mockResolvedValue({ id, path: asset.originalPath, assetId: asset.id } as never);
      mocks.asset.getById.mockResolvedValue(getForAsset(asset));

      await sut.deleteIntegrityReport(adminIds[0], id);

      expectResourceEvents(
        mocks,
        { userIds: adminIds, changed: [Resource.integrityReport(), Resource.integrityReportSummary()] },
        {
          userIds: [asset.ownerId],
          changed: [
            Resource.asset(asset),
            Resource.assetStatistics(),
            Resource.albums(),
            Resource.duplicates(),
            Resource.mapMarkers(),
            Resource.memories(),
            Resource.people(),
            Resource.search(),
            Resource.view(),
          ],
        },
      );
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
