import { ValidateUUID } from '../../../../../apps/immich/src/decorators/validate-uuid.decorator';

export class AssetIdsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
