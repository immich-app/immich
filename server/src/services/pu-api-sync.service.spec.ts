import { PuApiRepository } from 'src/repositories/pu-api.repository';
import { PuApiSyncService } from 'src/services/pu-api-sync.service';
import { vitest } from 'vitest';

describe(PuApiSyncService.name, () => {
  it('should sync for all user lifecycle event handlers', async () => {
    const puApiRepository = {
      syncTenantUsers: vitest.fn().mockResolvedValue(undefined),
    } as unknown as PuApiRepository;
    const sut = new PuApiSyncService(puApiRepository);

    await sut.onUserCreate();
    await sut.onUserUpdate();
    await sut.onUserTrash();
    await sut.onUserRestore();
    await sut.onUserDelete();

    expect(puApiRepository.syncTenantUsers).toHaveBeenCalledTimes(5);
  });
});
