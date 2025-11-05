import { AutoStackService } from 'src/services/auto-stack.service';
import { newTestService } from 'test/utils';

describe('AutoStackService - candidate de-duplication', () => {
  it('skips creating a candidate if assets overlap an active candidate', async () => {
    const { sut, mocks } = newTestService(AutoStackService);

    // Configure auto stack to be enabled with tight window/gap and minimal weights
    (mocks.config.getEnv as any).mockReturnValue({
      ...mocks.config.getEnv(),
      server: {
        ...mocks.config.getEnv().server,
        autoStack: {
          ...mocks.config.getEnv().server.autoStack,
          enabled: true,
          windowSeconds: 10,
          maxGapSeconds: 10,
          minGroupSize: 2,
          cameraMatch: false,
          autoPromoteMinScore: 0,
          weights: { size: 10, timeSpan: 10, continuity: 10, visual: 10, exposure: 10 },
        },
      },
    });

    // Two assets in time order
    (mocks.asset.getTimeWindowCameraSequence as any).mockResolvedValue([
      { id: 'a1', originalFileName: 'IMG_0001.JPG', dateTimeOriginal: new Date('2024-01-01T12:00:00Z') },
      { id: 'a2', originalFileName: 'IMG_0002.JPG', dateTimeOriginal: new Date('2024-01-01T12:00:05Z') },
    ]);
    // No embeddings required for this test
    (mocks.asset.getClipEmbeddings as any).mockResolvedValue({});

    // Simulate overlap: repository returns an existing active candidate for these assets
    (mocks.autoStackCandidate.listActiveIdsByAssetIds as any).mockResolvedValue(['cand_existing']);

    // Ensure create() is NOT called
    const createSpy = mocks.autoStackCandidate.create as any;

    const created = await (sut as any).generateTimeWindowCandidates('user1', new Date('2024-01-01T12:00:00Z'), 10);
    expect(created).toBe(0);
    expect(createSpy).not.toHaveBeenCalled();
  });
});
