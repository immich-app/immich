import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ClassConstructor, plainToInstance, Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, Max, Min, ValidateNested } from 'class-validator';
import { ValidateUUID } from 'src/validation';

export enum EditActionType {
  Crop = 'crop',
  Rotate = 'rotate',
  Mirror = 'mirror',
}

export enum RotationAngle {
  Angle0 = 0,
  Angle90 = 90,
  Angle180 = 180,
  Angle270 = 270,
}

export enum MirrorAxis {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export class CropParameters {
  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiProperty({ description: 'Left position of the crop' })
  left!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiProperty({ description: 'Right position of the crop' })
  right!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiProperty({ description: 'Top position of the crop' })
  top!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiProperty({ description: 'Bottom position of the crop' })
  bottom!: number;
}

export class RotateParameters {
  @IsEnum(RotationAngle)
  @ApiProperty({ enum: RotationAngle, enumName: 'RotationAngle', description: 'Rotation angle in degrees' })
  angle!: RotationAngle;
}

export class MirrorParameters {
  @IsEnum(MirrorAxis)
  @ApiProperty({ enum: MirrorAxis, enumName: 'MirrorAxis', description: 'Axis to mirror along' })
  axis!: MirrorAxis;
}

class EditActionBase {
  @IsEnum(EditActionType)
  @ApiProperty({ enum: [EditActionType.Crop], enumName: 'EditActionType' })
  action!: EditActionType.Crop;

  @IsInt()
  @Min(0)
  @ApiProperty({ description: 'Order of this edit in the sequence' })
  index!: number;
}

export class EditActionCrop extends EditActionBase {
  @ValidateNested()
  @Type(() => CropParameters)
  @ApiProperty({ type: CropParameters })
  parameters!: CropParameters;
}

export class EditActionRotate extends EditActionBase {
  @ValidateNested()
  @Type(() => RotateParameters)
  @ApiProperty({ type: RotateParameters })
  parameters!: RotateParameters;
}

export class EditActionMirror extends EditActionBase {
  @ValidateNested()
  @Type(() => MirrorParameters)
  @ApiProperty({ type: MirrorParameters })
  parameters!: MirrorParameters;
}

export type EditActionItem =
  | {
      action: EditActionType.Crop;
      parameters: CropParameters;
      index: number;
    }
  | {
      action: EditActionType.Rotate;
      parameters: RotateParameters;
      index: number;
    }
  | {
      action: EditActionType.Mirror;
      parameters: MirrorParameters;
      index: number;
    };

export type EditActionParameter = {
  [EditActionType.Crop]: CropParameters;
  [EditActionType.Rotate]: RotateParameters;
  [EditActionType.Mirror]: MirrorParameters;
};

type EditActions = EditActionCrop | EditActionRotate | EditActionMirror;
const actionToClass: Record<EditActionType, ClassConstructor<EditActions>> = {
  [EditActionType.Crop]: EditActionCrop,
  [EditActionType.Rotate]: EditActionRotate,
  [EditActionType.Mirror]: EditActionMirror,
} as const;

const getActionClass = (item: { action: EditActionType }): ClassConstructor<EditActions> => actionToClass[item.action];

@ApiExtraModels(EditActionRotate, EditActionMirror, EditActionCrop)
export class EditActionListDto {
  /** list of edits */
  @ValidateNested({ each: true })
  @Transform(({ value: edits }) =>
    Array.isArray(edits) ? edits.map((item) => plainToInstance(getActionClass(item), item)) : edits,
  )
  @ApiProperty({ anyOf: Object.values(actionToClass).map((target) => ({ $ref: getSchemaPath(target) })) })
  edits!: EditActionItem[];
}

export class AssetEditsDto extends EditActionListDto {
  @ValidateUUID()
  @ApiProperty()
  assetId!: string;
}
