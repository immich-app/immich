import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator.js';

export class RemoveAssetsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
