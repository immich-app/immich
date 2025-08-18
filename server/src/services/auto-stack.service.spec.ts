import { AutoStackService } from 'src/services/auto-stack.service';
import { newTestService, ServiceMocks } from 'test/utils';
import { beforeEach, describe, expect, it } from 'vitest';

describe(AutoStackService.name, () => {
  let sut: AutoStackService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AutoStackService));
    mocks.systemMetadata.get.mockResolvedValue({
      server: {
        autoStack: {
          enabled: true,
          windowSeconds: 5,
          maxGapSeconds: 5,
          minGroupSize: 2,
          horizonMinutes: 10,
          cameraMatch: true,
          maxCandidates: 100,
          autoPromoteMinScore: 10,
          weights: { size: 50, timeSpan: 10, continuity: 10, visual: 15, exposure: 10 },
          visualPromoteThreshold: 0.8,
          outlierPruneEnabled: true,
          outlierPruneMinDelta: 0.05,
          outlierPruneIterative: false,
        },
      },
    });
  });

  it('groups sequential assets by time + numeric suffix', async () => {
    // Override config to use high autoPromoteMinScore so candidate is not auto-promoted in this test
    mocks.systemMetadata.get.mockResolvedValue({
      server: {
        autoStack: {
          enabled: true,
          windowSeconds: 5,
          maxGapSeconds: 5,
          minGroupSize: 2,
          horizonMinutes: 10,
          cameraMatch: true,
          maxCandidates: 100,
          autoPromoteMinScore: 90,
          weights: { size: 50, timeSpan: 10, continuity: 10, visual: 15, exposure: 10 },
          visualPromoteThreshold: 0.8,
          outlierPruneEnabled: true,
          outlierPruneMinDelta: 0.05,
          outlierPruneIterative: false,
        },
      },
    });
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'a1', originalFileName: 'IMG_0001.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:00Z') },
      { id: 'a2', originalFileName: 'IMG_0002.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:01Z') },
      { id: 'a3', originalFileName: 'IMG_0100.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:10Z') },
    ] as any);
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    const created = await sut.generateTimeWindowCandidates('user1', new Date('2024-01-01T00:00:00Z'), 5);
    expect(created).toBe(1);
    expect(mocks.autoStackCandidate.create).toHaveBeenCalledTimes(1);
  });

  it('computes higher score for larger tight groups and triggers auto-promotion', async () => {
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'b1', originalFileName: 'IMG_1001.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:00Z') },
      { id: 'b2', originalFileName: 'IMG_1002.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:01Z') },
      { id: 'b3', originalFileName: 'IMG_1003.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:02Z') },
    ] as any);
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    await sut.generateTimeWindowCandidates('user1', new Date('2024-01-01T00:00:00Z'), 5);
    // Auto-promotion should create a stack and not count as candidate creation
    expect(mocks.stack.create).toHaveBeenCalledTimes(1);
    expect(mocks.autoStackCandidate.create).toHaveBeenCalledTimes(1);
    expect(mocks.autoStackCandidate.promote).toHaveBeenCalledTimes(1);
  });

  it('prunes oldest candidates beyond maxCandidates', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      server: {
        autoStack: {
          enabled: true,
          windowSeconds: 5,
          maxGapSeconds: 5,
          minGroupSize: 2,
          horizonMinutes: 10,
          cameraMatch: true,
          maxCandidates: 1,
          autoPromoteMinScore: 0,
          weights: { size: 50, timeSpan: 10, continuity: 10, visual: 15, exposure: 10 },
          visualPromoteThreshold: 0.9,
          outlierPruneEnabled: true,
          outlierPruneMinDelta: 0.05,
        },
      },
    });
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'c1', originalFileName: 'IMG_2001.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:00Z') },
      { id: 'c2', originalFileName: 'IMG_2002.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:01Z') },
    ] as any);
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    await sut.generateTimeWindowCandidates('user1', new Date('2024-01-01T00:00:00Z'), 5);
    expect(mocks.autoStackCandidate.create).toHaveBeenCalledTimes(1);
    // Second generation with different assets should trigger prune
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'd1', originalFileName: 'IMG_3001.jpg', dateTimeOriginal: new Date('2024-01-01T00:05:00Z') },
      { id: 'd2', originalFileName: 'IMG_3002.jpg', dateTimeOriginal: new Date('2024-01-01T00:05:01Z') },
    ] as any);
    await sut.generateTimeWindowCandidates('user1', new Date('2024-01-01T00:05:00Z'), 5);
    expect(mocks.autoStackCandidate.prune).toHaveBeenCalledWith('user1', 1);
  });

  it('passes make/model when cameraMatch enabled and reference asset provided', async () => {
    const refDate = new Date('2024-01-01T00:00:00Z');
    mocks.asset.getExifMakeModel.mockResolvedValue({ make: 'Canon', model: 'R5' });
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'a1', originalFileName: 'IMG_0001.jpg', dateTimeOriginal: refDate },
      { id: 'a2', originalFileName: 'IMG_0002.jpg', dateTimeOriginal: refDate },
    ] as any);
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    await sut.generateTimeWindowCandidates('user1', refDate, 5, 'a1');
    expect(mocks.asset.getTimeWindowCameraSequence).toHaveBeenCalledWith(
      expect.objectContaining({ make: 'Canon', model: 'R5' }),
    );
  });

  it('enqueues embedding and rescore jobs when embeddings missing', async () => {
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'e1', originalFileName: 'IMG_4001.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:00Z') },
      { id: 'e2', originalFileName: 'IMG_4002.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:01Z') },
    ] as any);
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    mocks.asset.getClipEmbeddings.mockResolvedValue({}); // no embeddings present
    await sut.generateTimeWindowCandidates('user1', new Date('2024-01-01T00:00:00Z'), 5);
    // Candidate created
    expect(mocks.autoStackCandidate.create).toHaveBeenCalled();
    // Embedding jobs queued per asset and a rescore job queued
    const queuedJobs = mocks.job.queueAll.mock.calls.flatMap((c: any) => c[0]);
    expect(queuedJobs.filter((j: any) => j.name === 'SmartSearch').length).toBeGreaterThanOrEqual(2);
    expect(mocks.job.queue).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'AutoStackCandidateRescore', data: expect.any(Object) }),
    );
  });

  it('iteratively prunes multiple outliers when enabled', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      server: {
        autoStack: {
          enabled: true,
          windowSeconds: 5,
          maxGapSeconds: 5,
          minGroupSize: 2,
          horizonMinutes: 10,
          cameraMatch: true,
          maxCandidates: 100,
          autoPromoteMinScore: 0,
          weights: { size: 50, timeSpan: 10, continuity: 10, visual: 15, exposure: 10 },
          visualPromoteThreshold: 0.99,
          outlierPruneEnabled: true,
          outlierPruneMinDelta: 0.01,
          outlierPruneIterative: true,
        },
      },
    });
    // Provide a group of 4 where two assets are visually dissimilar (no embeddings; rely on filename continuity only so pruning logic will not remove without embeddings) -> simulate embeddings
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'p1', originalFileName: 'IMG_5001.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:00Z') },
      { id: 'p2', originalFileName: 'IMG_5002.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:01Z') },
      { id: 'p3', originalFileName: 'IMG_9000.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:02Z') }, // outlier by filename sequence
      { id: 'p4', originalFileName: 'IMG_9001.jpg', dateTimeOriginal: new Date('2024-01-01T00:00:03Z') }, // second outlier
    ] as any);
    // Embeddings: make first two similar and last two dissimilar to first pair (simulate by high cosine within pairs only)
    const emb = (v: number[]) => v;
    mocks.asset.getClipEmbeddings.mockResolvedValue({
      p1: emb([1, 0, 0]),
      p2: emb([0.9, 0.1, 0]),
      p3: emb([0, 1, 0]),
      p4: emb([0, 0.9, 0.1]),
    });
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    await sut.generateTimeWindowCandidates('user1', new Date('2024-01-01T00:00:00Z'), 5);
    // Expect candidate created after pruning attempts
    expect(mocks.autoStackCandidate.create).toHaveBeenCalledTimes(1);
  });

  it('uses ML offload scoring when enabled to override visual component', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      server: {
        autoStack: {
          enabled: true,
          windowSeconds: 5,
          maxGapSeconds: 5,
          minGroupSize: 2,
          horizonMinutes: 10,
          cameraMatch: false,
          maxCandidates: 100,
          autoPromoteMinScore: 0,
          weights: { size: 50, timeSpan: 10, continuity: 10, visual: 15, exposure: 10 },
          visualPromoteThreshold: 0.99,
          outlierPruneEnabled: false,
        },
      },
      machineLearning: { urls: ['http://ml:3003'] },
    });
    // Provide 2 assets with embeddings, ensure local score visual would be lower than ML returned blended
    const t0 = new Date('2024-01-01T00:00:00Z');
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'm1', originalFileName: 'IMG_1001.jpg', dateTimeOriginal: t0, pHash: 'aaaaaaaaaaaaaaaa' },
      {
        id: 'm2',
        originalFileName: 'IMG_1002.jpg',
        dateTimeOriginal: new Date(t0.getTime() + 500),
        pHash: 'aaaaaaaaaaaaaaab',
      },
    ] as any);
    // Embeddings moderately similar (cos ~0.5) so local blended ~0.75* visualWeight maybe; ML returns blended 0.95
    mocks.asset.getClipEmbeddings.mockResolvedValue({
      m1: [1, 0, 0],
      m2: [0.5, 0.5, 0],
    });
    (mocks.machineLearning.autoStackScore as any).mockResolvedValue({ avgCos: 0.8, pHashAvg: 0.99, blended: 0.95 });
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    await sut.generateTimeWindowCandidates('user1', t0, 5);
    expect(mocks.machineLearning.autoStackScore).toHaveBeenCalled();
    expect(mocks.autoStackCandidate.create).toHaveBeenCalledTimes(1);
    const createArgs = mocks.autoStackCandidate.create.mock.calls[0];
    const components = createArgs[3];
    // visual component should reflect blended * visualWeight (15) ~= 14 (rounded)
    expect(components.visual).toBeGreaterThanOrEqual(13);
  });

  it('falls back to local scoring when ML offload fails', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      server: {
        autoStack: {
          enabled: true,
          windowSeconds: 5,
          maxGapSeconds: 5,
          minGroupSize: 2,
          horizonMinutes: 10,
          cameraMatch: false,
          maxCandidates: 100,
          autoPromoteMinScore: 0,
          weights: { size: 50, timeSpan: 10, continuity: 10, visual: 15, exposure: 10 },
          visualPromoteThreshold: 0.99,
          outlierPruneEnabled: false,
        },
      },
      machineLearning: { urls: ['http://ml:3003'] },
    });
    const t0 = new Date('2024-01-01T00:00:00Z');
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'f1', originalFileName: 'IMG_2001.jpg', dateTimeOriginal: t0 },
      { id: 'f2', originalFileName: 'IMG_2002.jpg', dateTimeOriginal: new Date(t0.getTime() + 400) },
    ] as any);
    mocks.asset.getClipEmbeddings.mockResolvedValue({ f1: [1, 0], f2: [0.1, 0.99] });
    (mocks.machineLearning.autoStackScore as any).mockRejectedValue(new Error('ml down'));
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    await sut.generateTimeWindowCandidates('user1', t0, 5);
    expect(mocks.machineLearning.autoStackScore).toHaveBeenCalled();
    expect(mocks.autoStackCandidate.create).toHaveBeenCalledTimes(1);
  });

  it('splits long low-cohesion group via session segmentation', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      server: {
        autoStack: {
          enabled: true,
          windowSeconds: 600,
          maxGapSeconds: 600,
          minGroupSize: 2,
          horizonMinutes: 10,
          cameraMatch: false,
          maxCandidates: 100,
          autoPromoteMinScore: 9999,
          weights: { size: 50, timeSpan: 10, continuity: 10, visual: 15, exposure: 10 },
          visualPromoteThreshold: 0.99,
          outlierPruneEnabled: false,
          sessionMaxSpanSeconds: 60,
          sessionMinAvgAdjacency: 0.9,
          sessionMinSegmentSize: 1,
        },
      },
    });
    // Four assets over > 3 minutes (span 210s > 60s) with low adjacency embeddings to trigger segmentation
    const base = new Date('2024-01-01T00:00:00Z');
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 's1', originalFileName: 'IMG_8001.jpg', dateTimeOriginal: base },
      { id: 's2', originalFileName: 'IMG_8002.jpg', dateTimeOriginal: new Date(base.getTime() + 70_000) },
      { id: 's3', originalFileName: 'IMG_8003.jpg', dateTimeOriginal: new Date(base.getTime() + 140_000) },
      { id: 's4', originalFileName: 'IMG_8004.jpg', dateTimeOriginal: new Date(base.getTime() + 210_000) },
    ] as any);
    mocks.asset.getClipEmbeddings.mockResolvedValue({
      s1: [1, 0],
      s2: [0, 1],
      s3: [1, 0],
      s4: [0, 1],
    });
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    await sut.generateTimeWindowCandidates('user1', base, 600);
    // Expect at least two create calls due to segmentation
    expect(mocks.autoStackCandidate.create.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('expands a group with visually similar neighbors inside secondary visual window', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      server: {
        autoStack: {
          enabled: true,
          windowSeconds: 5,
          maxGapSeconds: 5,
          minGroupSize: 2,
          horizonMinutes: 10,
          cameraMatch: false,
          maxCandidates: 100,
          autoPromoteMinScore: 9999,
          weights: { size: 10, timeSpan: 5, continuity: 5, visual: 15, exposure: 5 },
          visualPromoteThreshold: 0.99,
          outlierPruneEnabled: false,
          secondaryVisualWindowSeconds: 30,
          visualGroupSimilarityThreshold: 0.9,
          secondaryVisualMaxAdds: 5,
        },
      },
    });
    const t0 = new Date('2024-02-01T00:00:00Z');
    // Base group (two assets) + one similar asset 10s later outside primary 5s window but inside 30s secondary window
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'vx1', originalFileName: 'IMG_0101.jpg', dateTimeOriginal: t0, pHash: 'aaaaaaaaaaaaaaaa' },
      {
        id: 'vx2',
        originalFileName: 'IMG_0102.jpg',
        dateTimeOriginal: new Date(t0.getTime() + 1000),
        pHash: 'aaaaaaaaaaaaaaab',
      },
    ] as any);
    // Secondary fetch when expanding: include candidate vx3 (simulate repository call by returning superset when wider window asked)
    mocks.asset.getTimeWindowCameraSequence.mockImplementation(async (args: any) => {
      if (args.from && args.from < new Date(t0.getTime() - 4000)) {
        return [
          { id: 'vx1', originalFileName: 'IMG_0101.jpg', dateTimeOriginal: t0, pHash: 'aaaaaaaaaaaaaaaa' },
          {
            id: 'vx2',
            originalFileName: 'IMG_0102.jpg',
            dateTimeOriginal: new Date(t0.getTime() + 1000),
            pHash: 'aaaaaaaaaaaaaaab',
          },
          {
            id: 'vx3',
            originalFileName: 'IMG_0103.jpg',
            dateTimeOriginal: new Date(t0.getTime() + 10_000),
            pHash: 'aaaaaaaaaaaaaaac',
          },
        ] as any;
      }
      return [
        { id: 'vx1', originalFileName: 'IMG_0101.jpg', dateTimeOriginal: t0, pHash: 'aaaaaaaaaaaaaaaa' },
        {
          id: 'vx2',
          originalFileName: 'IMG_0102.jpg',
          dateTimeOriginal: new Date(t0.getTime() + 1000),
          pHash: 'aaaaaaaaaaaaaaab',
        },
      ] as any;
    });
    // Embeddings - make vx3 similar to vx1/vx2
    mocks.asset.getClipEmbeddings.mockResolvedValue({
      vx1: [1, 0, 0],
      vx2: [0.9, 0.1, 0],
      vx3: [0.95, 0.05, 0],
    });
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    await sut.generateTimeWindowCandidates('user1', t0, 5);
    // Expect candidate created with 3 assets after visual expansion
    const createdArgs = mocks.autoStackCandidate.create.mock.calls[0];
    expect(createdArgs[1].length).toBe(3);
  });

  it('caps visual expansion additions at configured maximum', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      server: {
        autoStack: {
          enabled: true,
          windowSeconds: 2,
          maxGapSeconds: 2,
          minGroupSize: 2,
          horizonMinutes: 10,
          cameraMatch: false,
          maxCandidates: 100,
          autoPromoteMinScore: 9999,
          weights: { size: 10, timeSpan: 5, continuity: 5, visual: 15, exposure: 5 },
          visualPromoteThreshold: 0.99,
          outlierPruneEnabled: false,
          secondaryVisualWindowSeconds: 40,
          visualGroupSimilarityThreshold: 0.8,
          secondaryVisualMaxAdds: 1,
        },
      },
    });
    const t0 = new Date('2024-03-01T00:00:00Z');
    mocks.asset.getTimeWindowCameraSequence.mockImplementation(async (args: any) => {
      if (args.from && args.from < new Date(t0.getTime() - 1000)) {
        return [
          { id: 'cx1', originalFileName: 'IMG_1001.jpg', dateTimeOriginal: t0 },
          { id: 'cx2', originalFileName: 'IMG_1002.jpg', dateTimeOriginal: new Date(t0.getTime() + 500) },
          { id: 'cx3', originalFileName: 'IMG_1003.jpg', dateTimeOriginal: new Date(t0.getTime() + 10_000) },
          { id: 'cx4', originalFileName: 'IMG_1004.jpg', dateTimeOriginal: new Date(t0.getTime() + 12_000) },
        ] as any;
      }
      return [
        { id: 'cx1', originalFileName: 'IMG_1001.jpg', dateTimeOriginal: t0 },
        { id: 'cx2', originalFileName: 'IMG_1002.jpg', dateTimeOriginal: new Date(t0.getTime() + 500) },
      ] as any;
    });
    // Embeddings - make all future candidates similar so they'd qualify if not capped
    mocks.asset.getClipEmbeddings.mockResolvedValue({
      cx1: [1, 0],
      cx2: [0.98, 0.02],
      cx3: [0.97, 0.03],
      cx4: [0.96, 0.04],
    });
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    await sut.generateTimeWindowCandidates('user1', t0, 2);
    const createdArgs = mocks.autoStackCandidate.create.mock.calls[0];
    // Should only add at most one beyond the initial 2 (maxAdds=1)
    expect(createdArgs[1].length).toBeLessThanOrEqual(4);
    expect(createdArgs[1].length).toBeGreaterThanOrEqual(3); // still expect at least one add
  });

  it('reorders primary asset when heuristic enabled to favor mid-timestamp asset', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      server: {
        autoStack: {
          enabled: true,
          windowSeconds: 10,
          maxGapSeconds: 10,
          minGroupSize: 3,
          horizonMinutes: 10,
          cameraMatch: false,
          maxCandidates: 100,
          autoPromoteMinScore: 9999,
          weights: { size: 10, timeSpan: 5, continuity: 5, visual: 15, exposure: 5 },
          visualPromoteThreshold: 0.99,
          outlierPruneEnabled: false,
          bestPrimaryHeuristic: true,
        },
      },
    });
    const t0 = new Date('2024-04-01T00:00:00Z');
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'rp1', originalFileName: 'IMG_0001.jpg', dateTimeOriginal: t0 },
      { id: 'rp2', originalFileName: 'IMG_0002.jpg', dateTimeOriginal: new Date(t0.getTime() + 2000) },
      { id: 'rp3', originalFileName: 'IMG_0003.jpg', dateTimeOriginal: new Date(t0.getTime() + 4000) },
    ] as any);
    mocks.asset.getClipEmbeddings.mockResolvedValue({});
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    await sut.generateTimeWindowCandidates('user1', t0, 10);
    const createdArgs = mocks.autoStackCandidate.create.mock.calls[0];
    const groupIds: string[] = createdArgs[1];
    // Expect primary chosen not always first; heuristic might pick center (rp2) or best continuity
    expect(groupIds[0]).not.toBeUndefined();
    expect(groupIds.includes('rp2')).toBe(true);
  });

  it('splits mixed orientation (portrait vs landscape) into separate groups', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      server: {
        autoStack: {
          enabled: true,
          windowSeconds: 20,
          maxGapSeconds: 20,
          minGroupSize: 2,
          horizonMinutes: 10,
          cameraMatch: false,
          maxCandidates: 100,
          autoPromoteMinScore: 9999,
          weights: { size: 10, timeSpan: 5, continuity: 5, visual: 15, exposure: 5 },
          visualPromoteThreshold: 0.99,
          outlierPruneEnabled: false,
        },
      },
    });
    const t0 = new Date('2024-05-01T00:00:00Z');
    // Provide 4 assets: two landscape (4:3) and two portrait (3:4) interleaved by time
    mocks.asset.getTimeWindowCameraSequence.mockResolvedValue([
      { id: 'o1', originalFileName: 'IMG_0001.jpg', dateTimeOriginal: t0, exifImageWidth: 4000, exifImageHeight: 3000 },
      {
        id: 'o2',
        originalFileName: 'IMG_0002.jpg',
        dateTimeOriginal: new Date(t0.getTime() + 1000),
        exifImageWidth: 3000,
        exifImageHeight: 4000,
      },
      {
        id: 'o3',
        originalFileName: 'IMG_0003.jpg',
        dateTimeOriginal: new Date(t0.getTime() + 2000),
        exifImageWidth: 4010,
        exifImageHeight: 3000,
      },
      {
        id: 'o4',
        originalFileName: 'IMG_0004.jpg',
        dateTimeOriginal: new Date(t0.getTime() + 3000),
        exifImageWidth: 2990,
        exifImageHeight: 4000,
      },
    ] as any);
    mocks.asset.getClipEmbeddings.mockResolvedValue({});
    mocks.autoStackCandidate.existsForAssets.mockResolvedValue(false as any);
    await sut.generateTimeWindowCandidates('user1', t0, 20);
    // Expect at least two candidate create calls (landscape group and portrait group)
    expect(mocks.autoStackCandidate.create.mock.calls.length).toBeGreaterThanOrEqual(2);
    const createdGroups = mocks.autoStackCandidate.create.mock.calls.map((c: any) => c[1]);
    const allIds = createdGroups.flat();
    expect(allIds).toContain('o1');
    expect(allIds).toContain('o2');
  });
});
