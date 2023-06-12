import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator';

export class AssetIdsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
