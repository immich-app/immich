import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { SystemConfig } from 'src/config';
import { AssetType, JobStatus, VideoFrameExtractionStatus } from 'src/enum';
import { VideoFrameService } from 'src/services/video-frame.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { probeStub } from 'test/fixtures/media.stub';
import { makeStream, mockSpawn, newTestService, ServiceMocks } from 'test/utils';
import { vitest } from 'vitest';

vitest.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    mkdtemp: vitest.fn(),
    readFile: vitest.fn(),
    rm: vitest.fn(),
  };
});

const videoFrameExtractionConfig: SystemConfig['videoFrameExtraction'] = {
  enabled: true,
  targetResolution: 640,
  qp: 34,
  frameInterval: 1,
};

const playlist = [
  '#EXTM3U',
  '#EXT-X-VERSION:7',
  '#EXT-X-MAP:URI="asset.m4s",BYTERANGE="813@0"',
  '#EXTINF:1.000000,',
  '#EXT-X-BYTERANGE:3843@813',
  'asset.m4s',
  '#EXTINF:1.000000,',
  '#EXT-X-BYTERANGE:3238@4656',
  'asset.m4s',
  '#EXT-X-ENDLIST',
].join('\n');

const scores = [
  'frame:0    pts:0       pts_time:0',
  'lavfi.scd.mafd=0.000',
  'lavfi.scd.score=0.000',
  'frame:1    pts:1       pts_time:1',
  'lavfi.scd.mafd=2.516',
  'lavfi.scd.score=2.516',
].join('\n');

describe(VideoFrameService.name, () => {
  let sut: VideoFrameService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(VideoFrameService));

    mocks.systemMetadata.get.mockResolvedValue({ videoFrameExtraction: videoFrameExtractionConfig });

    vitest.mocked(mkdtemp).mockResolvedValue('/tmp/immich-video-frames-asset-1');
    vitest.mocked(readFile).mockImplementation((path) => {
      return Promise.resolve(String(path).endsWith('scores.txt') ? scores : playlist);
    });
    vitest.mocked(rm).mockResolvedValue(void 0);

    mocks.videoFrame.upsertExtractionRecord.mockResolvedValue(void 0 as never);
    mocks.videoFrame.upsertFrames.mockResolvedValue(void 0 as never);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueGenerateVideoFrames', () => {
    it('should skip if disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        videoFrameExtraction: { ...videoFrameExtractionConfig, enabled: false },
      });

      await expect(sut.handleQueueGenerateVideoFrames({})).resolves.toEqual(JobStatus.Skipped);

      expect(mocks.assetJob.streamForVideoFrameExtraction).not.toHaveBeenCalled();
    });

    it('should queue all eligible video assets', async () => {
      const asset = AssetFactory.create({ type: AssetType.Video });
      mocks.assetJob.streamForVideoFrameExtraction.mockReturnValue(makeStream([asset]));

      await expect(sut.handleQueueGenerateVideoFrames({ force: true })).resolves.toEqual(JobStatus.Success);

      expect(mocks.assetJob.streamForVideoFrameExtraction).toHaveBeenCalledWith(true, expect.any(String));
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: 'VideoFrameExtraction', data: { id: asset.id } }]);
    });
  });

  describe('handleGenerateVideoFrames', () => {
    const asset = {
      ...AssetFactory.create({ id: 'asset-1', type: AssetType.Video, originalPath: '/original/path.ext' }),
      videoStream: probeStub.videoStreamH264.videoStream,
    };

    beforeEach(() => {
      mocks.assetJob.getForVideoFrameExtraction.mockResolvedValue(asset);
    });

    it('should skip if disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        videoFrameExtraction: { ...videoFrameExtractionConfig, enabled: false },
      });

      await expect(sut.handleGenerateVideoFrames({ id: asset.id })).resolves.toEqual(JobStatus.Skipped);

      expect(mocks.assetJob.getForVideoFrameExtraction).not.toHaveBeenCalled();
    });

    it('should fail if asset could not be found', async () => {
      mocks.assetJob.getForVideoFrameExtraction.mockResolvedValue(void 0);

      await expect(sut.handleGenerateVideoFrames({ id: asset.id })).resolves.toEqual(JobStatus.Failed);
    });

    it('should skip if an up-to-date extraction already exists', async () => {
      mocks.videoFrame.getExtractionRecord.mockResolvedValue(void 0);
      mocks.process.spawn.mockReturnValue(mockSpawn(0, '', '') as any);

      // first run computes and persists the current parameters hash
      await sut.handleGenerateVideoFrames({ id: asset.id });
      const [, persisted] = mocks.videoFrame.upsertExtractionRecord.mock.calls.at(-1)!;

      mocks.videoFrame.getExtractionRecord.mockResolvedValue({
        assetId: asset.id,
        ...persisted,
      } as never);
      mocks.process.spawn.mockClear();

      await expect(sut.handleGenerateVideoFrames({ id: asset.id })).resolves.toEqual(JobStatus.Skipped);

      expect(mocks.process.spawn).not.toHaveBeenCalled();
    });

    it('should generate frames and persist the extraction record', async () => {
      mocks.videoFrame.getExtractionRecord.mockResolvedValue(void 0);
      mocks.process.spawn.mockReturnValue(mockSpawn(0, '', '') as any);

      await expect(sut.handleGenerateVideoFrames({ id: asset.id })).resolves.toEqual(JobStatus.Success);

      expect(mocks.process.spawn).toHaveBeenCalledWith('ffmpeg', expect.any(Array), expect.any(Object));
      expect(mocks.videoFrame.upsertFrames).toHaveBeenCalledWith(asset.id, [
        { frameIndex: 0, byteOffset: 813, byteSize: 3843, intervalChange: 0 },
        { frameIndex: 1, byteOffset: 4656, byteSize: 3238, intervalChange: 2.516 },
      ]);
      expect(mocks.videoFrame.upsertExtractionRecord).toHaveBeenLastCalledWith(
        asset.id,
        expect.objectContaining({ status: VideoFrameExtractionStatus.Completed, initSegmentSize: 813 }),
      );
      expect(rm).toHaveBeenCalledWith('/tmp/immich-video-frames-asset-1', { recursive: true, force: true });
    });

    it('should mark the extraction as failed if ffmpeg fails', async () => {
      mocks.videoFrame.getExtractionRecord.mockResolvedValue(void 0);
      mocks.process.spawn.mockReturnValue({
        ...mockSpawn(1, '', 'ffmpeg stderr'),
        on: vitest.fn((event, cb: any) => {
          if (event === 'close') {
            cb(1);
          }
        }),
      } as any);

      await expect(sut.handleGenerateVideoFrames({ id: asset.id })).resolves.toEqual(JobStatus.Failed);

      expect(mocks.videoFrame.upsertExtractionRecord).toHaveBeenLastCalledWith(
        asset.id,
        expect.objectContaining({ status: VideoFrameExtractionStatus.Failed }),
      );
    });

    it('should mark the extraction as failed if no frames were extracted', async () => {
      mocks.videoFrame.getExtractionRecord.mockResolvedValue(void 0);
      mocks.process.spawn.mockReturnValue(mockSpawn(0, '', '') as any);
      vitest.mocked(readFile).mockResolvedValue('#EXTM3U\n#EXT-X-ENDLIST');

      await expect(sut.handleGenerateVideoFrames({ id: asset.id })).resolves.toEqual(JobStatus.Failed);

      expect(mocks.videoFrame.upsertFrames).not.toHaveBeenCalled();
      expect(mocks.videoFrame.upsertExtractionRecord).toHaveBeenLastCalledWith(
        asset.id,
        expect.objectContaining({ status: VideoFrameExtractionStatus.Failed }),
      );
    });
  });
});
