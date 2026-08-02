import {
  FujiDevelopParametersSchema,
  FujiDevelopProcessModel,
  FujiProfileSlug,
} from 'src/dtos/editing.dto';

const validParameters = {
  profileSlug: FujiProfileSlug.NostalgicNeg,
  processModel: FujiDevelopProcessModel.LightroomPv2012IndependentV6,
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: null,
  tint: null,
  vibrance: 0,
  saturation: 0,
};

describe('FujiDevelopParametersSchema', () => {
  it('exposes exactly the supported 20 film simulations', () => {
    expect(Object.values(FujiProfileSlug)).toHaveLength(20);
    expect(new Set(Object.values(FujiProfileSlug)).size).toBe(20);
  });

  it('accepts valid settings including explicit white balance', () => {
    expect(
      FujiDevelopParametersSchema.safeParse({ ...validParameters, temperature: 5600, tint: -12 }).success,
    ).toBe(true);
  });

  it.each([
    { key: 'exposure', value: 5.01 },
    { key: 'contrast', value: -101 },
    { key: 'highlights', value: 101 },
    { key: 'shadows', value: -101 },
    { key: 'whites', value: 101 },
    { key: 'blacks', value: -101 },
    { key: 'temperature', value: 1999 },
    { key: 'temperature', value: 50_001 },
    { key: 'tint', value: 151 },
    { key: 'vibrance', value: -101 },
    { key: 'saturation', value: 101 },
  ])('rejects out-of-range $key settings', ({ key, value }) => {
    expect(FujiDevelopParametersSchema.safeParse({ ...validParameters, [key]: value }).success).toBe(false);
  });

  it('rejects unknown profiles, process models, and keys', () => {
    expect(FujiDevelopParametersSchema.safeParse({ ...validParameters, profileSlug: 'not-a-profile' }).success).toBe(
      false,
    );
    expect(FujiDevelopParametersSchema.safeParse({ ...validParameters, processModel: 'future-model' }).success).toBe(
      false,
    );
    expect(FujiDevelopParametersSchema.safeParse({ ...validParameters, extra: true }).success).toBe(false);
  });
});
