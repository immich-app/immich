import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { SystemConfig } from 'src/config';
import { AssetType, JobStatus } from 'src/enum';
import { VideoFrameService } from 'src/services/video-frame.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { probeStub } from 'test/fixtures/media.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';
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

      expect(mocks.assetJob.streamForVideoFrameExtraction).toHaveBeenCalledWith(true);
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
  });
});
