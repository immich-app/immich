import { AlbumEntity } from './album.entity.js';
import { APIKeyEntity } from './api-key.entity.js';
import { AssetFaceEntity } from './asset-face.entity.js';
import { AssetEntity } from './asset.entity.js';
import { PartnerEntity } from './partner.entity.js';
import { PersonEntity } from './person.entity.js';
import { SharedLinkEntity } from './shared-link.entity.js';
import { SmartInfoEntity } from './smart-info.entity.js';
import { SystemConfigEntity } from './system-config.entity.js';
import { TagEntity } from './tag.entity.js';
import { UserTokenEntity } from './user-token.entity.js';
import { UserEntity } from './user.entity.js';

export * from './album.entity.js';
export * from './api-key.entity.js';
export * from './asset-face.entity.js';
export * from './asset.entity.js';
export * from './exif.entity.js';
export * from './partner.entity.js';
export * from './person.entity.js';
export * from './shared-link.entity.js';
export * from './smart-info.entity.js';
export * from './system-config.entity.js';
export * from './tag.entity.js';
export * from './user-token.entity.js';
export * from './user.entity.js';

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
