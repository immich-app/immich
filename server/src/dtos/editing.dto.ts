import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsEnum, IsInt, IsNumber, Min, ValidateNested } from 'class-validator';
import {
  IsAxisAlignedRotation,
  IsGreaterThanProperty,
  IsUniqueEditActions,
  ValidateEnum,
  ValidateUUID,
} from 'src/validation';

export enum AssetEditAction {
  Crop = 'crop',
  Rotate = 'rotate',
  Mirror = 'mirror',
  Trim = 'trim',
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

export class TrimParameters {
  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Start time in seconds' })
  startTime!: number;

  @IsNumber()
  @Min(0)
  @IsGreaterThanProperty('startTime')
  @ApiProperty({ description: 'End time in seconds' })
  endTime!: number;
}

export type AssetEditParameters = CropParameters | RotateParameters | MirrorParameters | TrimParameters;
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
      action: AssetEditAction.Trim;
      parameters: TrimParameters;
    };

@ApiExtraModels(CropParameters, RotateParameters, MirrorParameters, TrimParameters)
export class AssetEditActionItemDto {
  @ValidateEnum({ name: 'AssetEditAction', enum: AssetEditAction, description: 'Type of edit action to perform' })
  action!: AssetEditAction;

  @ApiProperty({
    description: 'List of edit actions to apply (crop, rotate, or mirror)',
    anyOf: [CropParameters, RotateParameters, MirrorParameters, TrimParameters].map((type) => ({
      $ref: getSchemaPath(type),
    })),
  })
  @ValidateNested()
  @Type((options) => actionParameterMap[options?.object.action as keyof AssetEditActionParameter])
  parameters!: AssetEditActionItem['parameters'];
}

export class AssetEditActionItemResponseDto extends AssetEditActionItemDto {
  @ValidateUUID()
  id!: string;
}

export type AssetEditActionParameter = typeof actionParameterMap;
const actionParameterMap = {
  [AssetEditAction.Crop]: CropParameters,
  [AssetEditAction.Rotate]: RotateParameters,
  [AssetEditAction.Mirror]: MirrorParameters,
  [AssetEditAction.Trim]: TrimParameters,
};

export class AssetEditsCreateDto {
  @ArrayMinSize(1)
  @IsUniqueEditActions()
  @ValidateNested({ each: true })
  @Type(() => AssetEditActionItemDto)
  @ApiProperty({ description: 'List of edit actions to apply (crop, rotate, or mirror)' })
  edits!: AssetEditActionItemDto[];
}

export class AssetEditsResponseDto {
  @ValidateUUID({ description: 'Asset ID these edits belong to' })
  assetId!: string;

  @ApiProperty({
    description: 'List of edit actions applied to the asset',
  })
  edits!: AssetEditActionItemResponseDto[];
}
