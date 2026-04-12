import { VideoSamplingStrategy } from 'src/enum';
import {
  dedupeSamplingOffsetsMs,
  MAX_VIDEO_SAMPLING_FRAMES,
  resolveVideoSamplingFractions,
} from 'src/utils/asset.util';

describe(resolveVideoSamplingFractions.name, () => {
  it('uses explicit fractions', () => {
    expect(
      resolveVideoSamplingFractions({
        strategy: VideoSamplingStrategy.Fractions,
        samplingFractions: [0.25, 0.5, 0.75],
        uniformFrameCount: 8,
        fractionStep: 0.1,
      }),
    ).toEqual([0.25, 0.5, 0.75]);
  });

  it('generates uniform interior samples', () => {
    expect(
      resolveVideoSamplingFractions({
        strategy: VideoSamplingStrategy.UniformCount,
        samplingFractions: [0.25],
        uniformFrameCount: 3,
        fractionStep: 0.1,
      }),
    ).toEqual([0.25, 0.5, 0.75]);
  });

  it('generates fixed-step samples', () => {
    expect(
      resolveVideoSamplingFractions({
        strategy: VideoSamplingStrategy.FixedStep,
        samplingFractions: [0.25],
        uniformFrameCount: 8,
        fractionStep: 0.1,
      }),
    ).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  });

  it('dedupes identical ms offsets', () => {
    expect(dedupeSamplingOffsetsMs([0, 0, 100, 100, 200])).toEqual([0, 100, 200]);
  });

  it('caps at MAX_VIDEO_SAMPLING_FRAMES', () => {
    const many = resolveVideoSamplingFractions({
      strategy: VideoSamplingStrategy.FixedStep,
      samplingFractions: [0.25],
      uniformFrameCount: 8,
      fractionStep: 0.01,
    });
    expect(many.length).toBe(MAX_VIDEO_SAMPLING_FRAMES);
  });
});
