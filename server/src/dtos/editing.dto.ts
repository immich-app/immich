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
  @ApiProperty({ enum: AssetEditAction, enumName: 'AssetEditAction', description: 'Type of edit action to perform' })
  action!: AssetEditAction;
}

export class AssetEditActionCrop extends AssetEditActionBase {
  @ValidateNested()
  @Type(() => CropParameters)
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  parameters!: CropParameters;
}

export class AssetEditActionRotate extends AssetEditActionBase {
  @ValidateNested()
  @Type(() => RotateParameters)
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  parameters!: RotateParameters;
}

export class AssetEditActionMirror extends AssetEditActionBase {
  @ValidateNested()
  @Type(() => MirrorParameters)
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
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

export type AssetEditActionItemResponse = AssetEditActionItem & { id: string };

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
  @ApiProperty({
    items: {
      anyOf: Object.values(actionToClass).map((type) => ({ $ref: getSchemaPath(type) })),
      discriminator: {
        propertyName: 'action',
        mapping: Object.fromEntries(
          Object.entries(actionToClass).map(([action, type]) => [action, getSchemaPath(type)]),
        ),
      },
    },
    description: 'List of edit actions to apply (crop, rotate, or mirror)',
  })
  edits!: AssetEditActionItem[];
}

export class AssetEditsDto extends AssetEditActionListDto {
  @ValidateUUID({ description: 'Asset ID to apply edits to' })
  assetId!: string;
}

export class AssetEditsResponseDto {
  @ValidateUUID({ description: 'Asset ID these edits belong to' })
  assetId!: string;

  @ValidateNested({ each: true })
  @Type(() => AssetEditActionListDto)
  edits!: AssetEditActionItemResponse[];
}
