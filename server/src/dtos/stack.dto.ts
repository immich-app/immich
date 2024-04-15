import { ValidateAssetId, ValidateUUID } from 'src/validation';

export class UpdateStackParentDto {
  @ValidateAssetId()
  oldParentId!: string;

  @ValidateAssetId()
  newParentId!: string;
}
