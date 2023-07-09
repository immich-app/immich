import { ValidateUUID } from '@app/domain';

export class RemoveAssetsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
