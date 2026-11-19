import { BadRequestException } from '@nestjs/common';
import { AssetFileType } from 'src/enum.js';
import { Resource } from 'src/resource-paths.js';
import { AssetFileService } from 'src/services/asset-file.service.js';
import { AssetFileFactory } from 'test/factories/asset-file.factory.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { ServiceMocks, expectResourceEvents, newTestService } from 'test/utils.js';

describe(AssetFileService.name, () => {
  let sut: AssetFileService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AssetFileService));
  });

  describe('delete', () => {
    it('should not delete a sidecar file', async () => {
      const file = AssetFileFactory.create({ type: AssetFileType.Sidecar });
      mocks.access.assetFile.checkOwnerAccess.mockResolvedValue(new Set([file.id]));
      mocks.assetFile.get.mockResolvedValue(file);

      await expect(sut.delete(AuthFactory.create(), file.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.assetFile.delete).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('should tell the owner about the deleted file', async () => {
      const auth = AuthFactory.create();
      const file = AssetFileFactory.create();
      mocks.access.assetFile.checkOwnerAccess.mockResolvedValue(new Set([file.id]));
      mocks.assetFile.get.mockResolvedValue(file);
      mocks.assetFile.delete.mockResolvedValue(true);

      await sut.delete(auth, file.id);
      expectResourceEvents(mocks, { userIds: [auth.user.id], deleted: [Resource.assetFile(file)] });
    });
  });
});
