import { ValidateBoolean } from '../../domain.util';

export class AlbumInfoDto {
  @ValidateBoolean({ optional: true })
  withoutAssets?: boolean;
}
