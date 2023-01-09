import { AlbumEntity, AssetEntity } from '@app/database';
import { SharedLinkType } from '@app/database/entities/shared-link.entity';

export class CreateSharedLinkDto {
  description?: string;
  expiredAt?: string;
  sharedType!: SharedLinkType;
  assets!: AssetEntity[];
  album?: AlbumEntity;
  allowUpload?: boolean;
}
