import { AutoStackController } from 'src/controllers/auto-stack.controller';
import { AutoStackService } from 'src/services/auto-stack.service';
import { StackService } from 'src/services/stack.service';
import { authStub } from 'test/fixtures/auth.stub';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const asMock = () => ({
  listCandidates: vi.fn(),
  getScoreDistribution: vi.fn(),
  promoteCandidate: vi.fn(),
  dismissCandidate: vi.fn(),
  rescoreCandidate: vi.fn(),
  resetAll: vi.fn(),
});

const ssMock = () => ({
  // No direct calls in these tests; keep placeholder in case controller wiring expands later
});

describe('AutoStackController', () => {
  let controller: AutoStackController;
  let autoStack: ReturnType<typeof asMock>;

  beforeEach(() => {
    autoStack = asMock();
    controller = new AutoStackController(autoStack as unknown as AutoStackService, ssMock() as unknown as StackService);
  });

  it('lists candidates via service', async () => {
    autoStack.listCandidates.mockResolvedValue([{ id: 'cand-1' }] as any);
    const res = await controller.listCandidates(authStub.user1 as any);
    expect(res).toEqual([{ id: 'cand-1' }] as any);
    expect(autoStack.listCandidates).toHaveBeenCalledWith(authStub.user1.user.id);
  });

  it('returns score stats via service', async () => {
    autoStack.getScoreDistribution.mockResolvedValue({ min: 0, max: 100 });
    const res = await controller.getScoreStats(authStub.user1 as any);
    expect(res).toEqual({ min: 0, max: 100 });
    expect(autoStack.getScoreDistribution).toHaveBeenCalledWith(authStub.user1.user.id);
  });

  it('promotes candidate via service with primaryAssetId passthrough', async () => {
    autoStack.promoteCandidate.mockResolvedValue({ stackId: 's1', primaryAssetId: 'a2' });
    const res = await controller.promote(authStub.user1 as any, 'cand-1', { primaryAssetId: 'a2' });
    expect(res).toEqual({ stackId: 's1', primaryAssetId: 'a2' });
    expect(autoStack.promoteCandidate).toHaveBeenCalledWith(authStub.user1 as any, 'cand-1', 'a2');
  });

  it('dismisses candidate via service', async () => {
    autoStack.dismissCandidate.mockResolvedValue({ status: 'dismissed' });
    const res = await controller.discard(authStub.user1 as any, 'cand-2');
    expect(res).toEqual({ status: 'dismissed' });
    expect(autoStack.dismissCandidate).toHaveBeenCalledWith(authStub.user1 as any, 'cand-2');
  });

  it('rescoring routes to service', async () => {
    autoStack.rescoreCandidate.mockResolvedValue({ status: 'queued' });
    const res = await controller.rescore(authStub.user1 as any, 'cand-3');
    expect(res).toEqual({ status: 'queued' });
    expect(autoStack.rescoreCandidate).toHaveBeenCalledWith(authStub.user1 as any, 'cand-3');
  });

  it('reset routes to service', async () => {
    autoStack.resetAll.mockResolvedValue({ status: 'queued' });
    const res = await controller.resetAll(authStub.user1 as any);
    expect(res).toEqual({ status: 'queued' });
    expect(autoStack.resetAll).toHaveBeenCalledWith(authStub.user1 as any);
  });
});
