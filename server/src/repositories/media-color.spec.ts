import ffmpeg, { type FfprobeData } from 'fluent-ffmpeg';
import { ColorMatrix, ColorPrimaries, ColorTransfer } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MediaRepository } from 'src/repositories/media.repository.js';
import { automock } from 'test/utils.js';

describe('HDR frame color recovery', () => {
  let sut: MediaRepository;
  let data: FfprobeData;

  beforeEach(() => {
    // eslint-disable-next-line no-sparse-arrays
    sut = new MediaRepository(automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false }));
    data = {
      streams: [
        {
          index: 2,
          codec_type: 'video',
          codec_name: 'hevc',
          width: 1920,
          height: 1080,
          pix_fmt: 'yuv420p10le',
          color_transfer: 'unknown',
        },
      ],
      format: {},
      chapters: [],
    } as FfprobeData;
    vi.spyOn(ffmpeg, 'ffprobe').mockImplementation((...args: unknown[]) => {
      const callback = args.at(-1) as (error: null, result: FfprobeData) => void;
      callback(null, data);
    });
    sut['probeFrameColors'] = vi.fn().mockResolvedValue({
      color_primaries: 'bt2020',
      color_transfer: 'arib-std-b67',
      color_space: 'bt2020nc',
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('recovers HLG metadata for a high-bit-depth stream with unknown transfer', async () => {
    const result = await sut.probe('video.mp4');
    expect(sut['probeFrameColors']).toHaveBeenCalledWith('video.mp4', 2);
    expect(result.videoStreams[0]).toMatchObject({
      colorTransfer: ColorTransfer.AribStdB67,
      colorPrimaries: ColorPrimaries.Bt2020,
      colorMatrix: ColorMatrix.Bt2020Nc,
    });
  });

  it('retains explicit SDR metadata without decoding extra frames', async () => {
    data.streams[0].color_transfer = 'bt709';
    const result = await sut.probe('video.mp4');
    expect(sut['probeFrameColors']).not.toHaveBeenCalled();
    expect(result.videoStreams[0].colorTransfer).toBe(ColorTransfer.Bt709);
  });

  it('fills missing fields without overwriting known container colors', async () => {
    data.streams[0].color_primaries = 'bt709';
    data.streams[0].color_space = 'bt709';
    const result = await sut.probe('video.mp4');
    expect(result.videoStreams[0]).toMatchObject({
      colorTransfer: ColorTransfer.AribStdB67,
      colorPrimaries: ColorPrimaries.Bt709,
      colorMatrix: ColorMatrix.Bt709,
    });
  });

  it('does not add frame decoding to ordinary untagged 8-bit video', async () => {
    data.streams[0].pix_fmt = 'yuv420p';
    await sut.probe('video.mp4');
    expect(sut['probeFrameColors']).not.toHaveBeenCalled();
  });

  it('checks an 8-bit stream tagged with BT.2020 primaries', async () => {
    data.streams[0].pix_fmt = 'yuv420p';
    data.streams[0].color_primaries = 'bt2020';
    const result = await sut.probe('video.mp4');
    expect(result.videoStreams[0].colorTransfer).toBe(ColorTransfer.AribStdB67);
  });

  it('preserves successful probing if a damaged video cannot be decoded', async () => {
    vi.mocked(sut['probeFrameColors']).mockRejectedValue(new Error('decode failed'));
    const result = await sut.probe('video.mp4');
    expect(result.videoStreams[0].colorTransfer).toBe(ColorTransfer.Unknown);
  });
});
