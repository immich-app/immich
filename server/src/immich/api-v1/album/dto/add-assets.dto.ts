import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator';

export class AddAssetsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
