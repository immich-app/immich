import { ValidateUUID } from 'apps/immich/src/decorators/validate-uuid.decorator';

export class AlbumIdDto {
  @ValidateUUID()
  albumId!: string;
}
