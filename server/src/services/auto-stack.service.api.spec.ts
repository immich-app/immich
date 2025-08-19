import { JobName } from 'src/enum';
import { AutoStackService } from 'src/services/auto-stack.service';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService, ServiceMocks } from 'test/utils';
import { beforeEach, describe, expect, it } from 'vitest';

describe(`${AutoStackService.name} API`, () => {
  let sut: AutoStackService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AutoStackService));
    // default enabled config
    mocks.systemMetadata.get.mockResolvedValue({
      server: { autoStack: { enabled: true } },
    });
    // default stack.update implementation for strict automock
    (mocks.stack.update as any).mockImplementation((id: string, entity: any) => {
      return {
        id,
        primaryAssetId: entity.primaryAssetId,
        assets: [],
      };
    });
  });

  it('resetAll: queues queue-all job and returns status', async () => {
    const res = await sut.resetAll(authStub.user1);
    expect(res).toEqual({ status: 'queued' });
    expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.AutoStackCandidateQueueAll, data: {} });
  });
});
