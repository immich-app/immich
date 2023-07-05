import { ValidateUUID } from '@app/domain';

export class GetLibrariesDto {
  /**
   * Only returns albums that contain the asset
   * undefined: get all albums
   */
  @ValidateUUID({ optional: true })
  assetId?: string;
}
