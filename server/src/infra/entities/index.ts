import { AlbumEntity } from './album.entity';
import { APIKeyEntity } from './api-key.entity';
import { AssetFaceEntity } from './asset-face.entity';
import { AssetEntity } from './asset.entity';
import { PartnerEntity } from './partner.entity';
import { PersonEntity } from './person.entity';
import { SharedLinkEntity } from './shared-link.entity';
import { SmartInfoEntity } from './smart-info.entity';
import { SystemConfigEntity } from './system-config.entity';
import { TagEntity } from './tag.entity';
import { UserTokenEntity } from './user-token.entity';
import { UserEntity } from './user.entity';

export * from './album.entity';
export * from './api-key.entity';
export * from './asset-face.entity';
export * from './asset.entity';
export * from './exif.entity';
export * from './partner.entity';
export * from './person.entity';
export * from './shared-link.entity';
export * from './smart-info.entity';
export * from './system-config.entity';
export * from './tag.entity';
export * from './user-token.entity';
export * from './user.entity';

export const databaseEntities = [
  AlbumEntity,
  APIKeyEntity,
  AssetEntity,
  AssetFaceEntity,
  PartnerEntity,
  PersonEntity,
  SharedLinkEntity,
  SmartInfoEntity,
  SystemConfigEntity,
  TagEntity,
  UserEntity,
  UserTokenEntity,
];
