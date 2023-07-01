import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator.js';

export class AssetIdsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
