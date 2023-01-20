import { AlbumEntity, AssetEntity } from '@app/infra';
import { SharedLinkType } from '@app/infra';

export class CreateSharedLinkDto {
  description?: string;
  expiredAt?: string;
  sharedType!: SharedLinkType;
  assets!: AssetEntity[];
  album?: AlbumEntity;
  allowUpload?: boolean;
}
