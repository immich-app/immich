import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ClassConstructor, plainToInstance, Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsEnum, IsInt, IsNumber, Max, Min, ValidateNested } from 'class-validator';
import { IsAxisAlignedRotation, IsUniqueEditActions, ValidateUUID } from 'src/validation';

export enum AssetEditAction {
  Crop = 'crop',
  Rotate = 'rotate',
  Mirror = 'mirror',
  Filter = 'filter',
}

export enum MirrorAxis {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export class CropParameters {
  @IsInt()
  @Min(0)
  @ApiProperty({ description: 'Top-Left X coordinate of crop' })
  x!: number;

  @IsInt()
  @Min(0)
  @ApiProperty({ description: 'Top-Left Y coordinate of crop' })
  y!: number;

  @IsInt()
  @Min(1)
  @ApiProperty({ description: 'Width of the crop' })
  width!: number;

  @IsInt()
  @Min(1)
  @ApiProperty({ description: 'Height of the crop' })
  height!: number;
}

export class RotateParameters {
  @IsAxisAlignedRotation()
  @ApiProperty({ description: 'Rotation angle in degrees' })
  angle!: number;
}

export class MirrorParameters {
  @IsEnum(MirrorAxis)
  @ApiProperty({ enum: MirrorAxis, enumName: 'MirrorAxis', description: 'Axis to mirror along' })
  axis!: MirrorAxis;
}

// Sharp supports a 3x3 matrix for color manipulation and rgb offsets
// The matrix representation of a filter is as follows:
//           | rrBias rgBias rbBias |   | r_offset |
//  Image x  | grBias ggBias gbBias | + | g_offset |
//           | brBias bgBias bbBias |   | b_offset |

export class FilterParameters {
  @IsNumber()
  @ApiProperty({ description: 'RR Bias' })
  rrBias!: number;

  @IsNumber()
  @ApiProperty({ description: 'RG Bias' })
  rgBias!: number;

  @IsNumber()
  @ApiProperty({ description: 'RB Bias' })
  rbBias!: number;

  @IsNumber()
  @ApiProperty({ description: 'GR Bias' })
  grBias!: number;

  @IsNumber()
  @ApiProperty({ description: 'GG Bias' })
  ggBias!: number;

  @IsNumber()
  @ApiProperty({ description: 'GB Bias' })
  gbBias!: number;

  @IsNumber()
  @ApiProperty({ description: 'BR Bias' })
  brBias!: number;

  @IsNumber()
  @ApiProperty({ description: 'BG Bias' })
  bgBias!: number;

  @IsNumber()
  @ApiProperty({ description: 'BB Bias' })
  bbBias!: number;

  @IsInt()
  @Min(-255)
  @Max(255)
  @ApiProperty({ description: 'R Offset (-255 -> 255)' })
  rOffset!: number;

  @IsInt()
  @Min(-255)
  @Max(255)
  @ApiProperty({ description: 'G Offset (-255 -> 255)' })
  gOffset!: number;

  @IsInt()
  @Min(-255)
  @Max(255)
  @ApiProperty({ description: 'B Offset (-255 -> 255)' })
  bOffset!: number;
}

class AssetEditActionBase {
  @IsEnum(AssetEditAction)
  @ApiProperty({ enum: AssetEditAction, enumName: 'AssetEditAction' })
  action!: AssetEditAction;
}

export class AssetEditActionCrop extends AssetEditActionBase {
  @ValidateNested()
  @Type(() => CropParameters)
  @ApiProperty({ type: CropParameters })
  parameters!: CropParameters;
}

export class AssetEditActionRotate extends AssetEditActionBase {
  @ValidateNested()
  @Type(() => RotateParameters)
  @ApiProperty({ type: RotateParameters })
  parameters!: RotateParameters;
}

export class AssetEditActionMirror extends AssetEditActionBase {
  @ValidateNested()
  @Type(() => MirrorParameters)
  @ApiProperty({ type: MirrorParameters })
  parameters!: MirrorParameters;
}
export class AssetEditActionFilter extends AssetEditActionBase {
  @ValidateNested()
  @Type(() => FilterParameters)
  @ApiProperty({ type: FilterParameters })
  parameters!: FilterParameters;
}

export type AssetEditActionItem =
  | {
      action: AssetEditAction.Crop;
      parameters: CropParameters;
    }
  | {
      action: AssetEditAction.Rotate;
      parameters: RotateParameters;
    }
  | {
      action: AssetEditAction.Mirror;
      parameters: MirrorParameters;
    }
  | {
      action: AssetEditAction.Filter;
      parameters: FilterParameters;
    };

export type AssetEditActionParameter = {
  [AssetEditAction.Crop]: CropParameters;
  [AssetEditAction.Rotate]: RotateParameters;
  [AssetEditAction.Mirror]: MirrorParameters;
  [AssetEditAction.Filter]: FilterParameters;
};

type AssetEditActions = AssetEditActionCrop | AssetEditActionRotate | AssetEditActionMirror | AssetEditActionFilter;
const actionToClass: Record<AssetEditAction, ClassConstructor<AssetEditActions>> = {
  [AssetEditAction.Crop]: AssetEditActionCrop,
  [AssetEditAction.Rotate]: AssetEditActionRotate,
  [AssetEditAction.Mirror]: AssetEditActionMirror,
  [AssetEditAction.Filter]: AssetEditActionFilter,
} as const;

const getActionClass = (item: { action: AssetEditAction }): ClassConstructor<AssetEditActions> =>
  actionToClass[item.action];

@ApiExtraModels(AssetEditActionRotate, AssetEditActionMirror, AssetEditActionCrop, AssetEditActionFilter)
export class AssetEditActionListDto {
  /** list of edits */
  @ArrayMinSize(1)
  @IsUniqueEditActions()
  @ValidateNested({ each: true })
  @Transform(({ value: edits }) =>
    Array.isArray(edits) ? edits.map((item) => plainToInstance(getActionClass(item), item)) : edits,
  )
  @ApiProperty({ anyOf: Object.values(actionToClass).map((target) => ({ $ref: getSchemaPath(target) })) })
  edits!: AssetEditActionItem[];
}

export class AssetEditsDto extends AssetEditActionListDto {
  @ValidateUUID()
  @ApiProperty()
  assetId!: string;
}
