import { MemoryDockController } from 'src/controllers/memorydock.controller.js';
import { MemoryDockService } from 'src/services/memorydock.service.js';
import { authStub } from 'test/fixtures/auth.stub.js';
import { factory } from 'test/small.factory.js';
import { mockBaseService } from 'test/utils.js';

describe(MemoryDockController.name, () => {
  const service = mockBaseService(MemoryDockService);
  let sut: MemoryDockController;

  beforeEach(() => {
    service.resetAllMocks();
    sut = new MemoryDockController(service);
  });

  describe('createStyleTransform', () => {
    it('should delegate ghibli style transform creation to the service', async () => {
      const assetId = factory.uuid();
      const response = { jobId: 'job-1', status: 'queued' };
      service.createStyleTransform.mockResolvedValue(response);

      await expect(sut.createStyleTransform(authStub.user1, { assetId, style: 'ghibli' })).resolves.toEqual(response);

      expect(service.createStyleTransform).toHaveBeenCalledWith(authStub.user1, { assetId, style: 'ghibli' });
    });
  });
});
