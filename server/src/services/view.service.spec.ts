import { mapAsset } from 'src/dtos/asset-response.dto';
import { ViewService } from 'src/services/view.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService, ServiceMocks } from 'test/utils';

describe(ViewService.name, () => {
  let sut: ViewService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(ViewService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getUniqueOriginalPaths', () => {
    it('should return unique original paths', async () => {
      const mockPaths = ['path1', 'path2', 'path3'];
      mocks.view.getUniqueOriginalPaths.mockResolvedValue(mockPaths);

      const result = await sut.getUniqueOriginalPaths(authStub.admin);

      expect(result).toEqual(mockPaths);
      expect(mocks.view.getUniqueOriginalPaths).toHaveBeenCalledWith(authStub.admin.user.id);
    });
  });

  describe('getAssetsByOriginalPath', () => {
    it('should return assets by original path', async () => {
      const path = '/asset';

      const asset1 = { ...assetStub.image, originalPath: '/asset/path1' };
      const asset2 = { ...assetStub.image, originalPath: '/asset/path2' };

      const mockAssets = [asset1, asset2];

      const mockAssetReponseDto = mockAssets.map((a) => mapAsset(a, { auth: authStub.admin }));

      mocks.view.getAssetsByOriginalPath.mockResolvedValue(mockAssets as any);

      const result = await sut.getAssetsByOriginalPath(authStub.admin, path);
      expect(result).toEqual(mockAssetReponseDto);
      await expect(mocks.view.getAssetsByOriginalPath(authStub.admin.user.id, path)).resolves.toEqual(mockAssets);
    });
  });
});
