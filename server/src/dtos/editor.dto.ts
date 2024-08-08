import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ClassConstructor, plainToInstance, Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, ValidateNested } from 'class-validator';
import { ValidateBoolean, ValidateUUID } from 'src/validation';

export enum EditorActionType {
  Crop = 'crop',
  Rotate = 'rotate',
  Blur = 'blur',
  Adjust = 'adjust',
}

export class EditorActionItem {
  @IsEnum(EditorActionType)
  @ApiProperty({ enum: EditorActionType, enumName: 'EditorActionType' })
  action!: EditorActionType;
}

export class EditorActionAdjust extends EditorActionItem {
  @IsInt()
  @ApiProperty({ type: 'integer' })
  brightness!: number;

  @IsInt()
  @ApiProperty({ type: 'integer' })
  saturation!: number;

  @IsInt()
  @ApiProperty({ type: 'integer' })
  hue!: number;

  @IsInt()
  @ApiProperty({ type: 'integer' })
  lightness!: number;
}

export class EditorActionBlur extends EditorActionItem {}

class EditorCropRegion {
  @IsInt()
  @ApiProperty({ type: 'integer' })
  left!: number;

  @IsInt()
  @ApiProperty({ type: 'integer' })
  top!: number;

  @IsInt()
  @ApiProperty({ type: 'integer' })
  width!: number;

  @IsInt()
  @ApiProperty({ type: 'integer' })
  height!: number;
}

export class EditorActionCrop extends EditorActionItem {
  @Type(() => EditorCropRegion)
  @ValidateNested()
  region!: EditorCropRegion;
}

export class EditorActionRotate extends EditorActionItem {
  @IsInt()
  @ApiProperty({ type: 'integer' })
  angle!: number;
}

export type EditorAction = EditorActionRotate | EditorActionBlur | EditorActionCrop | EditorActionAdjust;

const actionToClass: Record<EditorActionType, ClassConstructor<EditorAction>> = {
  [EditorActionType.Crop]: EditorActionCrop,
  [EditorActionType.Rotate]: EditorActionRotate,
  [EditorActionType.Blur]: EditorActionBlur,
  [EditorActionType.Adjust]: EditorActionAdjust,
};

const getActionClass = (item: EditorActionItem): ClassConstructor<EditorAction> =>
  actionToClass[item.action] || EditorActionItem;

@ApiExtraModels(EditorActionRotate, EditorActionBlur, EditorActionCrop, EditorActionAdjust)
export class EditorCreateAssetDto {
  /** Source asset id */
  @ValidateUUID()
  id!: string;

  /** Stack the edit and the original */
  @ValidateBoolean({ optional: true })
  stack?: boolean;

  /** list of edits */
  @ValidateNested({ each: true })
  @Transform(({ value: edits }) =>
    Array.isArray(edits) ? edits.map((item) => plainToInstance(getActionClass(item), item)) : edits,
  )
  @ApiProperty({ anyOf: Object.values(actionToClass).map((target) => ({ $ref: getSchemaPath(target) })) })
  edits!: EditorAction[];
}
