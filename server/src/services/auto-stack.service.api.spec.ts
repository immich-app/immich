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
    (mocks.stack.update as any).mockImplementation(async (id: string, entity: any) => ({
      id,
      primaryAssetId: entity.primaryAssetId,
      assets: [],
    }));
  });

  it('promoteCandidate: creates stack, sets primary when provided, promotes candidate and emits events', async () => {
    const candidateId = 'cand-1';
    const assetIds = ['a1', 'a2'];
    // listCandidates -> candidate with assets
    mocks.autoStackCandidate.list.mockResolvedValue([
      { id: candidateId, assets: assetIds.map((id, i) => ({ assetId: id, position: i })) },
    ] as any);
    // stack repo create returns id and default primary as first asset
    mocks.stack.create.mockResolvedValue({
      id: 'stack-1',
      primaryAssetId: 'a1',
      assets: assetIds.map((id) => ({ id })),
    } as any);

    const res = await sut.promoteCandidate(authStub.user1, candidateId, 'a2');

    expect(res).toEqual({ stackId: 'stack-1', primaryAssetId: 'a2' });
    expect(mocks.stack.create).toHaveBeenCalledWith({ ownerId: authStub.user1.user.id }, assetIds);
    expect(mocks.stack.update).toHaveBeenCalledWith('stack-1', { id: 'stack-1', primaryAssetId: 'a2' });
    expect(mocks.autoStackCandidate.promote).toHaveBeenCalledWith(candidateId, authStub.user1.user.id, 'stack-1');
    expect(mocks.event.emit).toHaveBeenCalledWith('StackCreate', {
      stackId: 'stack-1',
      userId: authStub.user1.user.id,
    });
  });

  it('promoteCandidate: returns not-found for missing candidate', async () => {
    mocks.autoStackCandidate.list.mockResolvedValue([] as any);
    const res = await sut.promoteCandidate(authStub.user1, 'missing');
    expect(res).toEqual({ error: 'not-found' });
  });

  it('promoteCandidate: returns disabled when feature off', async () => {
    mocks.systemMetadata.get.mockResolvedValue({ server: { autoStack: { enabled: false } } });
    const res = await sut.promoteCandidate(authStub.user1, 'any');
    expect(res).toEqual({ error: 'disabled' });
  });

  it('rescoreCandidate: queues rescore when candidate exists', async () => {
    const candidateId = 'cand-2';
    mocks.autoStackCandidate.list.mockResolvedValue([{ id: candidateId, assets: [] }] as any);
    const res = await sut.rescoreCandidate(authStub.user1, candidateId);
    expect(res).toEqual({ status: 'queued' });
    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.AutoStackCandidateRescore,
      data: { id: candidateId },
    });
  });

  it('rescoreCandidate: returns not-found when candidate missing', async () => {
    mocks.autoStackCandidate.list.mockResolvedValue([] as any);
    const res = await sut.rescoreCandidate(authStub.user1, 'missing');
    expect(res).toEqual({ error: 'not-found' });
  });

  it('rescoreCandidate: returns disabled when feature off', async () => {
    mocks.systemMetadata.get.mockResolvedValue({ server: { autoStack: { enabled: false } } });
    const res = await sut.rescoreCandidate(authStub.user1, 'cand');
    expect(res).toEqual({ error: 'disabled' });
  });

  it('dismissCandidate: dismisses and returns status', async () => {
    const res = await sut.dismissCandidate(authStub.user1, 'cand-3');
    expect(res).toEqual({ status: 'dismissed' });
    expect(mocks.autoStackCandidate.dismiss).toHaveBeenCalledWith('cand-3', authStub.user1.user.id);
  });

  it('resetAll: queues queue-all job and returns status', async () => {
    const res = await sut.resetAll(authStub.user1);
    expect(res).toEqual({ status: 'queued' });
    expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.AutoStackCandidateQueueAll, data: {} });
  });
});
