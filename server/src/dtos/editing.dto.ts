import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export enum AssetEditAction {
  Crop = 'crop',
  Rotate = 'rotate',
  Mirror = 'mirror',
  FujiDevelop = 'fuji_develop',
}

export const AssetEditActionSchema = z
  .enum(AssetEditAction)
  .describe('Type of edit action to perform')
  .meta({ id: 'AssetEditAction' });

export enum MirrorAxis {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export enum FujiProfileSlug {
  ProviaStandard = 'provia-standard',
  VelviaVivid = 'velvia-vivid',
  AstiaSoft = 'astia-soft',
  ClassicChrome = 'classic-chrome',
  RealaAceV2 = 'reala-ace-v2',
  ProNegHi = 'pro-neg-hi',
  ProNegStd = 'pro-neg-std',
  ClassicNeg = 'classic-neg',
  NostalgicNeg = 'nostalgic-neg',
  EternaCinema = 'eterna-cinema',
  BleachBypass = 'bleach-bypass',
  Acros = 'acros',
  AcrosGFilter = 'acros-g-filter',
  AcrosRFilter = 'acros-r-filter',
  AcrosYeFilter = 'acros-ye-filter',
  Monochrome = 'monochrome',
  MonochromeGFilter = 'monochrome-g-filter',
  MonochromeRFilter = 'monochrome-r-filter',
  MonochromeYeFilter = 'monochrome-ye-filter',
  Sepia = 'sepia',
}

export const FujiProfileSlugSchema = z
  .enum(FujiProfileSlug)
  .describe('Fujifilm film simulation profile')
  .meta({ id: 'FujiProfileSlug' });

export enum FujiDevelopProcessModel {
  LightroomPv2012IndependentV6 = 'lightroom-pv2012-independent-v6',
}

export const FujiDevelopProcessModelSchema = z
  .enum(FujiDevelopProcessModel)
  .describe('Versioned Fuji RAW development process model')
  .meta({ id: 'FujiDevelopProcessModel' });

const MirrorAxisSchema = z.enum(['horizontal', 'vertical']).describe('Axis to mirror along').meta({ id: 'MirrorAxis' });

const CropParametersSchema = z
  .object({
    x: z.int().min(0).describe('Top-Left X coordinate of crop'),
    y: z.int().min(0).describe('Top-Left Y coordinate of crop'),
    width: z.int().min(1).describe('Width of the crop'),
    height: z.int().min(1).describe('Height of the crop'),
  })
  .meta({ id: 'CropParameters' });

const RotateParametersSchema = z
  .object({
    angle: z
      .number()
      .refine((v) => [0, 90, 180, 270].includes(v), {
        error: 'Angle must be one of the following values: 0, 90, 180, 270',
      })
      .describe('Rotation angle in degrees'),
  })
  .meta({ id: 'RotateParameters' });

const MirrorParametersSchema = z
  .object({
    axis: MirrorAxisSchema,
  })
  .meta({ id: 'MirrorParameters' });

export const FujiDevelopParametersSchema = z
  .object({
    profileSlug: FujiProfileSlugSchema,
    processModel: FujiDevelopProcessModelSchema,
    exposure: z.number().min(-5).max(5).describe('Exposure adjustment in stops'),
    contrast: z.number().min(-100).max(100).describe('Contrast adjustment'),
    highlights: z.number().min(-100).max(100).describe('Highlights adjustment'),
    shadows: z.number().min(-100).max(100).describe('Shadows adjustment'),
    whites: z.number().min(-100).max(100).describe('Whites adjustment'),
    blacks: z.number().min(-100).max(100).describe('Blacks adjustment'),
    temperature: z.number().min(2000).max(50_000).nullable().describe('White balance temperature in kelvin'),
    tint: z.number().min(-150).max(150).nullable().describe('White balance tint adjustment'),
    vibrance: z.number().min(-100).max(100).describe('Vibrance adjustment'),
    saturation: z.number().min(-100).max(100).describe('Saturation adjustment'),
  })
  .strict()
  .meta({ id: 'FujiDevelopParameters' });

// TODO: ideally we would use the discriminated union directly in the future not only for type support but also for validation and openapi generation
const __AssetEditActionItemSchema = z.discriminatedUnion('action', [
  z.object({ action: AssetEditActionSchema.extract(['Crop']), parameters: CropParametersSchema }),
  z.object({ action: AssetEditActionSchema.extract(['Rotate']), parameters: RotateParametersSchema }),
  z.object({ action: AssetEditActionSchema.extract(['Mirror']), parameters: MirrorParametersSchema }),
  z.object({ action: AssetEditActionSchema.extract(['FujiDevelop']), parameters: FujiDevelopParametersSchema }),
]);

const AssetEditParametersSchema = z
  .union([CropParametersSchema, RotateParametersSchema, MirrorParametersSchema, FujiDevelopParametersSchema], {
    error: getExpectedKeysByActionMessage,
  })
  .describe('Parameters for an asset edit action');

const actionParameterMap = {
  [AssetEditAction.Crop]: CropParametersSchema,
  [AssetEditAction.Rotate]: RotateParametersSchema,
  [AssetEditAction.Mirror]: MirrorParametersSchema,
  [AssetEditAction.FujiDevelop]: FujiDevelopParametersSchema,
} as const;

function getExpectedKeysByActionMessage(): string {
  const expectedByAction = Object.entries(actionParameterMap)
    .map(([action, schema]) => `${action}: [${Object.keys(schema.shape).join(', ')}]`)
    .join('; ');

  return `Invalid parameters for action, expected keys by action: ${expectedByAction}`;
}

function isParametersValidForAction(edit: z.infer<typeof AssetEditActionItemSchema>): boolean {
  return actionParameterMap[edit.action].safeParse(edit.parameters).success;
}

const AssetEditActionItemSchema = z
  .object({
    action: AssetEditActionSchema,
    parameters: AssetEditParametersSchema,
  })
  .superRefine((edit, ctx) => {
    if (!isParametersValidForAction(edit)) {
      ctx.addIssue({
        code: 'custom',
        path: ['parameters'],
        message: `Invalid parameters for action '${edit.action}', expecting keys: ${Object.keys(actionParameterMap[edit.action].shape).join(', ')}`,
      });
    }
  })
  .meta({ id: 'AssetEditActionItemDto' });

export type AssetEditActionItem = z.infer<typeof __AssetEditActionItemSchema>;
export type AssetEditParameters = AssetEditActionItem['parameters'];

function uniqueEditActions(edits: z.infer<typeof AssetEditActionItemSchema>[]): boolean {
  const keys = new Set<string>();
  for (const edit of edits) {
    const key = edit.action === 'mirror' ? `mirror-${JSON.stringify(edit.parameters)}` : edit.action;
    if (keys.has(key)) {
      return false;
    }
    keys.add(key);
  }
  return true;
}

const AssetEditsCreateSchema = z
  .object({
    edits: z
      .array(AssetEditActionItemSchema)
      .min(1)
      .describe('List of edit actions to apply')
      .refine(uniqueEditActions, { error: 'Duplicate edit actions are not allowed' }),
  })
  .meta({ id: 'AssetEditsCreateDto' });

const AssetEditActionItemResponseSchema = AssetEditActionItemSchema.extend({
  id: z.uuidv4().describe('Asset edit ID'),
}).meta({ id: 'AssetEditActionItemResponseDto' });

const AssetEditsResponseSchema = z
  .object({
    assetId: z.uuidv4().describe('Asset ID these edits belong to'),
    edits: z.array(AssetEditActionItemResponseSchema).describe('List of edit actions applied to the asset'),
  })
  .meta({ id: 'AssetEditsResponseDto' });

export class AssetEditActionItemResponseDto extends createZodDto(AssetEditActionItemResponseSchema) {}
export class AssetEditsCreateDto extends createZodDto(AssetEditsCreateSchema) {}
export class AssetEditsResponseDto extends createZodDto(AssetEditsResponseSchema) {}
export type CropParameters = z.infer<typeof CropParametersSchema>;
export type FujiDevelopParameters = z.infer<typeof FujiDevelopParametersSchema>;
