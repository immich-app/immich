import { ValidateUUID } from 'apps/immich/src/decorators/validate-uuid.decorator';

export class RemoveAssetsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
