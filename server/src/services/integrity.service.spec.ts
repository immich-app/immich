import { IntegrityReport } from 'src/enum';
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

  describe('handleUntrackedFiles', () => {
    beforeEach(() => {
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getAssetFilePathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getPersonThumbnailPathsByPaths.mockResolvedValue([]);
    });

    it('should only report paths that no asset references', async () => {
      const originalPath = '/data/upload/admin/ab/asset.mov';
      const encodedVideoPath = '/data/encoded-video/admin/ab/asset.mp4';
      const untracked = '/data/upload/orphan.mov';
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([{ originalPath, encodedVideoPath }] as never);

      await sut.handleUntrackedFiles({ type: 'asset', paths: [originalPath, encodedVideoPath, untracked] });

      expect(mocks.integrityReport.getAssetFilePathsByPaths).not.toHaveBeenCalled();
      expect(mocks.integrityReport.create).toHaveBeenCalledWith([
        { type: IntegrityReport.UntrackedFile, path: untracked },
      ]);
    });

    it('should not report a path that is a person thumbnail', async () => {
      const thumbnailPath = '/data/thumbs/admin/person.jpeg';
      mocks.integrityReport.getPersonThumbnailPathsByPaths.mockResolvedValue([{ thumbnailPath }] as never);

      await sut.handleUntrackedFiles({ type: 'asset_file', paths: [thumbnailPath] });

      expect(mocks.integrityReport.getAssetPathsByPaths).not.toHaveBeenCalled();
      expect(mocks.integrityReport.create).not.toHaveBeenCalled();
    });
  });

  describe('handleUntrackedRefresh', () => {
    beforeEach(() => {
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getAssetFilePathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getPersonThumbnailPathsByPaths.mockResolvedValue([]);
    });

    it('should delete a report whose path is now referenced by an asset', async () => {
      const path = '/data/upload/admin/ab/asset.mov';
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([
        { originalPath: path, encodedVideoPath: null },
      ] as never);

      await sut.handleUntrackedRefresh({ items: [{ reportId: 'report-id', path }] });

      expect(mocks.integrityReport.deleteByIds).toHaveBeenCalledWith(['report-id']);
      expect(mocks.storage.stat).not.toHaveBeenCalled();
    });

    it('should keep a report whose path is still untracked and present on disk', async () => {
      mocks.storage.stat.mockResolvedValue({} as never);

      await sut.handleUntrackedRefresh({ items: [{ reportId: 'report-id', path: '/data/upload/orphan.mov' }] });

      expect(mocks.integrityReport.deleteByIds).not.toHaveBeenCalled();
    });
  });

  describe('deleteIntegrityReport', () => {
    beforeEach(() => {
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getAssetFilePathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getPersonThumbnailPathsByPaths.mockResolvedValue([]);
    });

    it('should not unlink a path that is now referenced by an asset', async () => {
      const path = '/data/upload/admin/ab/asset.mov';
      mocks.integrityReport.getById.mockResolvedValue({ path } as never);
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([
        { originalPath: path, encodedVideoPath: null },
      ] as never);

      await sut.deleteIntegrityReport('user-id', 'report-id');

      expect(mocks.storage.unlink).not.toHaveBeenCalled();
      expect(mocks.integrityReport.deleteById).toHaveBeenCalledWith('report-id');
    });

    it('should unlink a path that is still untracked', async () => {
      const path = '/data/upload/orphan.mov';
      mocks.integrityReport.getById.mockResolvedValue({ path } as never);

      await sut.deleteIntegrityReport('user-id', 'report-id');

      expect(mocks.storage.unlink).toHaveBeenCalledWith(path);
      expect(mocks.integrityReport.deleteById).toHaveBeenCalledWith('report-id');
    });
  });

  describe('handleDeleteIntegrityReports', () => {
    beforeEach(() => {
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getAssetFilePathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getPersonThumbnailPathsByPaths.mockResolvedValue([]);
    });

    it('should skip unlinking paths that are now referenced', async () => {
      const tracked = '/data/upload/admin/ab/asset.mov';
      const untracked = '/data/upload/orphan.mov';
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([
        { originalPath: tracked, encodedVideoPath: null },
      ] as never);
      mocks.storage.unlink.mockResolvedValue(void 0);

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
