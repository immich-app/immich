import { computeRollCoverScale, gpanoTagsToPannellumConfig, readGpanoTags } from '$lib/utils/gpano';

vi.mock('exifr', () => ({
  parse: vi.fn(),
}));

describe('gpanoTagsToPannellumConfig', () => {
  it('returns an empty object when no tags are present', () => {
    expect(gpanoTagsToPannellumConfig({})).toEqual({});
  });

  it('maps poseHeadingDegrees to northOffset as-is', () => {
    expect(gpanoTagsToPannellumConfig({ poseHeadingDegrees: 90 })).toEqual({ northOffset: 90 });
  });

  it('maps posePitchDegrees to horizonPitch with no negation', () => {
    expect(gpanoTagsToPannellumConfig({ posePitchDegrees: 10 })).toEqual({ horizonPitch: 10 });
  });

  it('maps poseRollDegrees to horizonRoll, negated', () => {
    expect(gpanoTagsToPannellumConfig({ poseRollDegrees: 15 })).toEqual({ horizonRoll: -15 });
    expect(gpanoTagsToPannellumConfig({ poseRollDegrees: -15 })).toEqual({ horizonRoll: 15 });
  });

  it('wraps heading delta across the 0/360 boundary (heading moves forward through 0)', () => {
    // 350 -> 10 is a +20 delta going through 0, not -340
    expect(gpanoTagsToPannellumConfig({ poseHeadingDegrees: 350, initialViewHeadingDegrees: 10 })).toEqual({
      northOffset: 350,
      yaw: 20,
    });
  });

  it('wraps heading delta across the 0/360 boundary (heading moves backward through 0)', () => {
    // 10 -> 350 is a -20 delta going through 0, not +340
    expect(gpanoTagsToPannellumConfig({ poseHeadingDegrees: 10, initialViewHeadingDegrees: 350 })).toEqual({
      northOffset: 10,
      yaw: -20,
    });
  });

  it('yields yaw 0 when initial view heading equals pose heading', () => {
    expect(gpanoTagsToPannellumConfig({ poseHeadingDegrees: 45, initialViewHeadingDegrees: 45 })).toEqual({
      northOffset: 45,
      yaw: 0,
    });
  });

  it('treats missing poseHeadingDegrees as 0 when only initialViewHeadingDegrees is set', () => {
    expect(gpanoTagsToPannellumConfig({ initialViewHeadingDegrees: 30 })).toEqual({ yaw: 30 });
  });

  it('keeps the yaw boundary at exactly 180, not -180', () => {
    expect(gpanoTagsToPannellumConfig({ poseHeadingDegrees: 0, initialViewHeadingDegrees: 180 })).toEqual({
      northOffset: 0,
      yaw: 180,
    });
  });

  it('maps initialViewPitchDegrees to pitch with no transform', () => {
    expect(gpanoTagsToPannellumConfig({ initialViewPitchDegrees: -30 })).toEqual({ pitch: -30 });
  });

  it('carries initialViewRollDegrees through unchanged (no negation at this layer)', () => {
    expect(gpanoTagsToPannellumConfig({ initialViewRollDegrees: 45 })).toEqual({ initialViewRollDegrees: 45 });
  });

  it('maps initialHorizontalFovDegrees to hfov, and omits the key entirely when absent', () => {
    expect(gpanoTagsToPannellumConfig({ initialHorizontalFovDegrees: 110 })).toEqual({ hfov: 110 });
    expect(gpanoTagsToPannellumConfig({})).not.toHaveProperty('hfov');
  });

  it('maps a full tag set in one shot', () => {
    expect(
      gpanoTagsToPannellumConfig({
        poseHeadingDegrees: 270,
        posePitchDegrees: 5,
        poseRollDegrees: 3,
        initialViewHeadingDegrees: 280,
        initialViewPitchDegrees: -10,
        initialViewRollDegrees: 2,
        initialHorizontalFovDegrees: 100,
      }),
    ).toEqual({
      northOffset: 270,
      horizonPitch: 5,
      horizonRoll: -3,
      yaw: 10,
      pitch: -10,
      initialViewRollDegrees: 2,
      hfov: 100,
    });
  });
});

describe('computeRollCoverScale', () => {
  it('returns scale 1 for a zero angle regardless of aspect ratio', () => {
    expect(computeRollCoverScale(1600, 900, 0)).toBeCloseTo(1);
    expect(computeRollCoverScale(900, 1600, 0)).toBeCloseTo(1);
  });

  it('returns max(w/h, h/w) for a 90 degree angle', () => {
    expect(computeRollCoverScale(1600, 900, 90)).toBeCloseTo(1600 / 900);
    expect(computeRollCoverScale(900, 1600, 90)).toBeCloseTo(1600 / 900);
  });

  it('matches the closed-form value for a 45 degree angle on a square', () => {
    expect(computeRollCoverScale(100, 100, 45)).toBeCloseTo(Math.SQRT1_2 + Math.SQRT1_2);
  });

  it('is symmetric for positive and negative angles', () => {
    expect(computeRollCoverScale(1600, 900, 45)).toBeCloseTo(computeRollCoverScale(1600, 900, -45));
  });
});

describe('readGpanoTags', () => {
  it('picks only the known numeric GPano fields from the exifr result', async () => {
    const exifr = await import('exifr');
    vi.mocked(exifr.parse).mockResolvedValue({
      PoseHeadingDegrees: 270,
      PosePitchDegrees: 5,
      PoseRollDegrees: 3,
      InitialViewHeadingDegrees: 280,
      InitialViewPitchDegrees: -10,
      InitialViewRollDegrees: 2,
      InitialHorizontalFOVDegrees: 100,
      Make: 'Insta360',
    });

    await expect(readGpanoTags(new Blob())).resolves.toEqual({
      poseHeadingDegrees: 270,
      posePitchDegrees: 5,
      poseRollDegrees: 3,
      initialViewHeadingDegrees: 280,
      initialViewPitchDegrees: -10,
      initialViewRollDegrees: 2,
      initialHorizontalFovDegrees: 100,
    });
  });

  it('ignores non-numeric values for known fields', async () => {
    const exifr = await import('exifr');
    vi.mocked(exifr.parse).mockResolvedValue({ PoseHeadingDegrees: 'not-a-number' });

    await expect(readGpanoTags(new Blob())).resolves.toEqual({});
  });

  it('resolves to an empty object instead of throwing when exifr rejects', async () => {
    const exifr = await import('exifr');
    vi.mocked(exifr.parse).mockRejectedValue(new Error('boom'));

    await expect(readGpanoTags(new Blob())).resolves.toEqual({});
  });

  it('resolves to an empty object when exifr resolves to undefined', async () => {
    const exifr = await import('exifr');
    vi.mocked(exifr.parse).mockResolvedValue(undefined);

    await expect(readGpanoTags(new Blob())).resolves.toEqual({});
  });
});
