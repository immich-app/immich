import { ActivityEntity } from 'src/infra/entities/activity.entity';
import { AlbumEntity } from 'src/infra/entities/album.entity';
import { APIKeyEntity } from 'src/infra/entities/api-key.entity';
import { AssetFaceEntity } from 'src/infra/entities/asset-face.entity';
import { AssetJobStatusEntity } from 'src/infra/entities/asset-job-status.entity';
import { AssetStackEntity } from 'src/infra/entities/asset-stack.entity';
import { AssetEntity } from 'src/infra/entities/asset.entity';
import { AuditEntity } from 'src/infra/entities/audit.entity';
import { ExifEntity } from 'src/infra/entities/exif.entity';
import { GeodataPlacesEntity } from 'src/infra/entities/geodata-places.entity';
import { LibraryEntity } from 'src/infra/entities/library.entity';
import { MoveEntity } from 'src/infra/entities/move.entity';
import { PartnerEntity } from 'src/infra/entities/partner.entity';
import { PersonEntity } from 'src/infra/entities/person.entity';
import { SharedLinkEntity } from 'src/infra/entities/shared-link.entity';
import { SmartInfoEntity } from 'src/infra/entities/smart-info.entity';
import { SmartSearchEntity } from 'src/infra/entities/smart-search.entity';
import { SystemConfigEntity } from 'src/infra/entities/system-config.entity';
import { SystemMetadataEntity } from 'src/infra/entities/system-metadata.entity';
import { TagEntity } from 'src/infra/entities/tag.entity';
import { UserTokenEntity } from 'src/infra/entities/user-token.entity';
import { UserEntity } from 'src/infra/entities/user.entity';

export const databaseEntities = [
  ActivityEntity,
  AlbumEntity,
  APIKeyEntity,
  AssetEntity,
  AssetStackEntity,
  AssetFaceEntity,
  AssetJobStatusEntity,
  AuditEntity,
  ExifEntity,
  GeodataPlacesEntity,
  MoveEntity,
  PartnerEntity,
  PersonEntity,
  SharedLinkEntity,
  SmartInfoEntity,
  SmartSearchEntity,
  SystemConfigEntity,
  SystemMetadataEntity,
  TagEntity,
  UserEntity,
  UserTokenEntity,
  LibraryEntity,
];
