import { ValidateUUID } from '../../domain.util';

export class UpdateAssetStackDto {
  @ValidateUUID()
  stackParentId!: string;

  @ValidateUUID({ each: true, optional: true })
  toAdd?: string[];

  @ValidateUUID({ each: true, optional: true })
  toRemove?: string[];
}

export class UpdateStackParentDto {
  @ValidateUUID()
  oldParentId!: string;

  @ValidateUUID()
  newParentId!: string;
}
