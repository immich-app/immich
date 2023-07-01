import { ValidateUUID } from '../../domain.util';

export class AssetIdsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
