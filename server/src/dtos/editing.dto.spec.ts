import { AssetEditAction, AssetEditsCreateDto } from 'src/dtos/editing.dto';

describe('asset edit DTO', () => {
  it('should accept brightness and contrast at their supported limits', () => {
    const result = AssetEditsCreateDto.schema.safeParse({
      edits: [
        {
          action: AssetEditAction.Color,
          parameters: { brightness: -100, contrast: 100 },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('should reject brightness and contrast values outside their supported limits', () => {
    for (const parameters of [
      { brightness: -101, contrast: 0 },
      { brightness: 0, contrast: 101 },
    ]) {
      const result = AssetEditsCreateDto.schema.safeParse({
        edits: [{ action: AssetEditAction.Color, parameters }],
      });

      expect(result.success).toBe(false);
    }
  });
});
