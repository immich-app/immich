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
    const decomposedPath = '/data/upload/upload/user-id/Cafe\u{301}.jpg';
    const composedPath = '/data/upload/upload/user-id/Caf\u{E9}.jpg';

    beforeEach(() => {
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getAssetFilePathsByPaths.mockResolvedValue([]);
      mocks.integrityReport.getPersonThumbnailPathsByPaths.mockResolvedValue([]);
    });

    it('should not report a tracked asset whose path differs only by unicode normalization', async () => {
      mocks.integrityReport.getAssetPathsByPaths.mockResolvedValue([
        { originalPath: composedPath, encodedVideoPath: null },
      ]);

      await sut.handleUntrackedFiles({ type: 'asset', paths: [decomposedPath] });

      expect(mocks.integrityReport.create).not.toHaveBeenCalled();
    });

    it('should report a file that no asset references', async () => {
      await sut.handleUntrackedFiles({ type: 'asset', paths: [decomposedPath] });

      expect(mocks.integrityReport.create).toHaveBeenCalledWith([
        { type: IntegrityReport.UntrackedFile, path: decomposedPath },
      ]);
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
