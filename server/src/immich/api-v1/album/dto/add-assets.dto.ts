import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator.js';

export class AddAssetsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
