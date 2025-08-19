import { JobStatus } from 'src/enum';
import { AutoStackService } from 'src/services/auto-stack.service';
import { newTestService } from 'test/utils';

describe('AutoStackService - pHash backfill batch', () => {
  it('calls listMissingPHash and processes a batch', async () => {
    const { sut, mocks } = newTestService(AutoStackService);

    // Enable feature
    (mocks.config.getEnv as any).mockReturnValue({
      ...mocks.config.getEnv(),
      server: {
        ...mocks.config.getEnv().server,
        autoStack: {
          ...mocks.config.getEnv().server.autoStack,
          enabled: true,
          pHashBackfillEnabled: true,
        },
      },
    });

    // Mock 3 assets missing pHash
    (mocks.asset.listMissingPHash as any).mockResolvedValue([
      { id: 'x1', originalPath: '/data/a1.jpg' },
      { id: 'x2', originalPath: '/data/a2.jpg' },
      { id: 'x3', originalPath: '/data/a3.jpg' },
    ]);
    // ML returns a valid 16-hex pHash for each
    (mocks.machineLearning.computePhash as any)
      .mockResolvedValueOnce('0123456789abcdef')
      .mockResolvedValueOnce('fedcba9876543210')
      .mockResolvedValueOnce('0011223344556677');

    // Spy upsertExif to be called for each entry
    const upsertSpy = mocks.asset.upsertExif as any;

    const result = await (sut as any).handlePHashBackfill();
    expect(result).toBe(JobStatus.Success);
    expect(mocks.asset.listMissingPHash).toHaveBeenCalledWith(3);
    expect(upsertSpy).toHaveBeenCalledTimes(3);
    expect(upsertSpy).toHaveBeenCalledWith(expect.objectContaining({ assetId: 'x1', pHash: expect.any(String) }));
    expect(upsertSpy).toHaveBeenCalledWith(expect.objectContaining({ assetId: 'x2', pHash: expect.any(String) }));
    expect(upsertSpy).toHaveBeenCalledWith(expect.objectContaining({ assetId: 'x3', pHash: expect.any(String) }));
  });
});
