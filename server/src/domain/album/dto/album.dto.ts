import { ValidateBoolean } from 'src/domain/domain.util';

export class AlbumInfoDto {
  @ValidateBoolean({ optional: true })
  withoutAssets?: boolean;
}
