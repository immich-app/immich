import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator';

export class RemoveAssetsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
