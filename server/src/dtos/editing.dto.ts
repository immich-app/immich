import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ClassConstructor, plainToInstance, Transform } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';
import { ValidateUUID } from 'src/validation';

export enum EditActionType {
  Crop = 'crop',
  Rotate = 'rotate',
  Mirror = 'mirror',
}

export class EditActionItem {
  @IsEnum(EditActionType)
  @ApiProperty({ enum: EditActionType, enumName: 'EditActionType' })
  action!: EditActionType;
}

export class EditActionCrop extends EditActionItem {
  @ApiProperty()
  left!: number;

  @ApiProperty()
  right!: number;

  @ApiProperty()
  top!: number;

  @ApiProperty()
  bottom!: number;
}

export enum RotationAngle {
  Angle0 = 0,
  Angle90 = 90,
  Angle180 = 180,
  Angle270 = 270,
}

export class EditActionRotate extends EditActionItem {
  @ApiProperty()
  @IsEnum(RotationAngle)
  angle!: RotationAngle;
}

export class EditActionMirror extends EditActionItem {}

export type EditAction = EditActionRotate | EditActionCrop | EditActionMirror;

const actionToClass: Record<EditActionType, ClassConstructor<EditAction>> = {
  [EditActionType.Crop]: EditActionCrop,
  [EditActionType.Rotate]: EditActionRotate,
  [EditActionType.Mirror]: EditActionMirror,
};

const getActionClass = (item: EditActionItem): ClassConstructor<EditAction> =>
  actionToClass[item.action] || EditActionItem;

@ApiExtraModels(EditActionRotate, EditActionMirror, EditActionCrop)
export class EditActionListDto {
  /** list of edits */
  @ValidateNested({ each: true })
  @Transform(({ value: edits }) =>
    Array.isArray(edits) ? edits.map((item) => plainToInstance(getActionClass(item), item)) : edits,
  )
  @ApiProperty({ anyOf: Object.values(actionToClass).map((target) => ({ $ref: getSchemaPath(target) })) })
  edits!: EditAction[];
}

export class AssetEditsDto extends EditActionListDto {
  @ValidateUUID()
  @ApiProperty()
  assetId!: string;
}
