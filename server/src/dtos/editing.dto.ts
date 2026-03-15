import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNumber, IsString, Max, Min, ValidateNested } from 'class-validator';
import { IsAxisAlignedRotation, IsUniqueEditActions, ValidateEnum, ValidateUUID } from 'src/validation';

export enum AssetEditAction {
  Crop = 'crop',
  Rotate = 'rotate',
  Mirror = 'mirror',
  Adjust = 'adjust',
  AutoEnhance = 'auto-enhance',
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

export class AdjustParameters {
  @IsNumber()
  @Min(0)
  @Max(2)
  @ApiProperty({ description: 'Brightness multiplier', default: 1.0 })
  brightness: number = 1.0;

  @IsNumber()
  @Min(0)
  @Max(2)
  @ApiProperty({ description: 'Contrast multiplier', default: 1.0 })
  contrast: number = 1.0;

  @IsNumber()
  @Min(0)
  @Max(2)
  @ApiProperty({ description: 'Saturation multiplier', default: 1.0 })
  saturation: number = 1.0;

  @IsInt()
  @Min(0)
  @Max(360)
  @ApiProperty({ description: 'Hue rotation in degrees', default: 0 })
  hue: number = 0;

  @IsNumber()
  @Min(0)
  @Max(2)
  @ApiProperty({ description: 'Sharpness sigma', default: 0 })
  sharpness: number = 0;
}

export class AutoEnhanceParameters {
  // No parameters needed - server decides optimal values
}

export class FilterParameters {
  @IsString()
  @ApiProperty({ description: 'Name of the filter preset' })
  name!: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @ApiProperty({ description: 'Color matrix as array of 20 numbers (4x5 matrix)', type: [Number] })
  matrix!: number[];
}

export type AssetEditParameters = CropParameters | RotateParameters | MirrorParameters | AdjustParameters | AutoEnhanceParameters | FilterParameters;
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
      action: AssetEditAction.Adjust;
      parameters: AdjustParameters;
    }
  | {
      action: AssetEditAction.AutoEnhance;
      parameters: AutoEnhanceParameters;
    }
  | {
      action: AssetEditAction.Filter;
      parameters: FilterParameters;
    };

@ApiExtraModels(CropParameters, RotateParameters, MirrorParameters, AdjustParameters, AutoEnhanceParameters, FilterParameters)
export class AssetEditActionItemDto {
  @ValidateEnum({ name: 'AssetEditAction', enum: AssetEditAction, description: 'Type of edit action to perform' })
  action!: AssetEditAction;

  @ApiProperty({
    description: 'List of edit actions to apply (crop, rotate, mirror, adjust, auto-enhance, or filter)',
    anyOf: [CropParameters, RotateParameters, MirrorParameters, AdjustParameters, AutoEnhanceParameters, FilterParameters].map((type) => ({
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
  [AssetEditAction.Adjust]: AdjustParameters,
  [AssetEditAction.AutoEnhance]: AutoEnhanceParameters,
  [AssetEditAction.Filter]: FilterParameters,
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
