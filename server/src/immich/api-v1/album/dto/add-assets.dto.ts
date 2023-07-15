import { ValidateUUID } from '@app/domain';

export class AddAssetsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
