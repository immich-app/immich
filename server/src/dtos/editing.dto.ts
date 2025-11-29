import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ClassConstructor, plainToInstance, Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, Min, ValidateNested } from 'class-validator';
import { ValidateUUID } from 'src/validation';

export enum EditAction {
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
  @IsEnum(EditAction)
  @ApiProperty({ enum: EditAction, enumName: 'EditAction' })
  action!: EditAction;
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
      action: EditAction.Crop;
      parameters: CropParameters;
    }
  | {
      action: EditAction.Rotate;
      parameters: RotateParameters;
    }
  | {
      action: EditAction.Mirror;
      parameters: MirrorParameters;
    };

export type EditActionParameter = {
  [EditAction.Crop]: CropParameters;
  [EditAction.Rotate]: RotateParameters;
  [EditAction.Mirror]: MirrorParameters;
};

type EditActions = EditActionCrop | EditActionRotate | EditActionMirror;
const actionToClass: Record<EditAction, ClassConstructor<EditActions>> = {
  [EditAction.Crop]: EditActionCrop,
  [EditAction.Rotate]: EditActionRotate,
  [EditAction.Mirror]: EditActionMirror,
} as const;

const getActionClass = (item: { action: EditAction }): ClassConstructor<EditActions> => actionToClass[item.action];

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
