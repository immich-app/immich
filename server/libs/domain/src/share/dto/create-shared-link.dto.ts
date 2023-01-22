import { AlbumEntity, AssetEntity, SharedLinkType } from '@app/infra/db/entities';

export class CreateSharedLinkDto {
  description?: string;
  expiredAt?: string;
  sharedType!: SharedLinkType;
  assets!: AssetEntity[];
  album?: AlbumEntity;
  allowUpload?: boolean;
  allowDownload?: boolean;
  showExif?: boolean;
}
