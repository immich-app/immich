import { ValidateUUID } from 'apps/immich/src/decorators/validate-uuid.decorator';

export class AddAssetsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
