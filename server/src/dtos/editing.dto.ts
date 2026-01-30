import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ClassConstructor, plainToInstance, Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsEnum, IsInt, Min, ValidateNested } from 'class-validator';
import { IsAxisAlignedRotation, IsUniqueEditActions, ValidateUUID } from 'src/validation';

export enum AssetEditAction {
  Crop = 'crop',
  Rotate = 'rotate',
  Mirror = 'mirror',
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
    };

export type AssetEditActionParameter = {
  [AssetEditAction.Crop]: CropParameters;
  [AssetEditAction.Rotate]: RotateParameters;
  [AssetEditAction.Mirror]: MirrorParameters;
};

type AssetEditActions = AssetEditActionCrop | AssetEditActionRotate | AssetEditActionMirror;
const actionToClass: Record<AssetEditAction, ClassConstructor<AssetEditActions>> = {
  [AssetEditAction.Crop]: AssetEditActionCrop,
  [AssetEditAction.Rotate]: AssetEditActionRotate,
  [AssetEditAction.Mirror]: AssetEditActionMirror,
} as const;

const getActionClass = (item: { action: AssetEditAction }): ClassConstructor<AssetEditActions> =>
  actionToClass[item.action];

@ApiExtraModels(AssetEditActionRotate, AssetEditActionMirror, AssetEditActionCrop)
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
