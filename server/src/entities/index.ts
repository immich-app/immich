import { KyselifyEntity } from 'kysely-typeorm';
import { ActivityEntity } from 'src/entities/activity.entity';
import { AlbumAssetEntity } from 'src/entities/album-asset.entity';
import { AlbumUserEntity } from 'src/entities/album-user.entity';
import { AlbumEntity } from 'src/entities/album.entity';
import { APIKeyEntity } from 'src/entities/api-key.entity';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetFileEntity } from 'src/entities/asset-files.entity';
import { AssetJobStatusEntity } from 'src/entities/asset-job-status.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { AuditEntity } from 'src/entities/audit.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { FaceSearchEntity } from 'src/entities/face-search.entity';
import { GeodataPlacesEntity } from 'src/entities/geodata-places.entity';
import { LibraryEntity } from 'src/entities/library.entity';
import { MemoryAssetEntity } from 'src/entities/memory-asset.entity';
import { MemoryEntity } from 'src/entities/memory.entity';
import { MoveEntity } from 'src/entities/move.entity';
import { NaturalEarthCountriesEntity } from 'src/entities/natural-earth-countries.entity';
import { PartnerEntity } from 'src/entities/partner.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { SessionEntity } from 'src/entities/session.entity';
import { SharedLinkAssetEntity } from 'src/entities/shared-link-asset.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { SmartSearchEntity } from 'src/entities/smart-search.entity';
import { StackEntity } from 'src/entities/stack.entity';
import { SystemMetadataEntity } from 'src/entities/system-metadata.entity';
import { TagAssetEntity } from 'src/entities/tag-asset.entity';
import { TagClosureEntity } from 'src/entities/tag-closure.entity';
import { TagEntity } from 'src/entities/tag.entity';
import { UserMetadataEntity } from 'src/entities/user-metadata.entity';
import { UserEntity } from 'src/entities/user.entity';
import { VersionHistoryEntity } from 'src/entities/version-history.entity';

export const entities = [
  ActivityEntity,
  AlbumEntity,
  AlbumUserEntity,
  APIKeyEntity,
  AssetEntity,
  AssetFaceEntity,
  AssetFileEntity,
  AssetJobStatusEntity,
  AuditEntity,
  ExifEntity,
  FaceSearchEntity,
  GeodataPlacesEntity,
  NaturalEarthCountriesEntity,
  MemoryEntity,
  MoveEntity,
  PartnerEntity,
  PersonEntity,
  SharedLinkEntity,
  SmartSearchEntity,
  StackEntity,
  SystemMetadataEntity,
  TagAssetEntity,
  TagClosureEntity,
  TagEntity,
  UserEntity,
  UserMetadataEntity,
  SessionEntity,
  LibraryEntity,
  VersionHistoryEntity,
];

export type Activity = KyselifyEntity<ActivityEntity>;
export type Albums = KyselifyEntity<AlbumEntity>;
export type AlbumsAssetsAssets = KyselifyEntity<AlbumAssetEntity>;
export type AlbumsSharedUsersUsers = KyselifyEntity<AlbumUserEntity>;
export type ApiKeys = KyselifyEntity<APIKeyEntity>;
export type AssetFaces = KyselifyEntity<AssetFaceEntity>;
export type AssetFiles = KyselifyEntity<AssetFileEntity>;
export type AssetJobStatus = KyselifyEntity<AssetJobStatusEntity>;
export type Assets = KyselifyEntity<AssetEntity>;
export type AssetStack = KyselifyEntity<StackEntity>;
export type Audit = KyselifyEntity<AuditEntity>;
export type Exif = KyselifyEntity<ExifEntity>;
export type FaceSearch = KyselifyEntity<FaceSearchEntity>;
export type GeodataPlaces = KyselifyEntity<GeodataPlacesEntity>;
export type Libraries = KyselifyEntity<LibraryEntity>;
export type Memories = KyselifyEntity<MemoryEntity>;
export type MemoriesAssetsAssets = KyselifyEntity<MemoryAssetEntity>;
export type MoveHistory = KyselifyEntity<MoveEntity>;
export type NaturalearthCountries = KyselifyEntity<NaturalEarthCountriesEntity>;
export type Partners = KyselifyEntity<PartnerEntity>;
export type Person = KyselifyEntity<PersonEntity>;
export type Sessions = KyselifyEntity<SessionEntity>;
export type SharedLinkAsset = KyselifyEntity<SharedLinkAssetEntity>;
export type SharedLinks = KyselifyEntity<SharedLinkEntity>;
export type SmartSearch = KyselifyEntity<SmartSearchEntity>;
export type SystemMetadata = KyselifyEntity<SystemMetadataEntity>;
export type TagAsset = KyselifyEntity<TagAssetEntity>;
export type Tags = KyselifyEntity<TagEntity>;
export type TagsClosure = KyselifyEntity<TagClosureEntity>;
export type UserMetadata = KyselifyEntity<UserMetadataEntity>;
export type Users = KyselifyEntity<UserEntity>;

export interface DB {
  activity: Activity;
  albums: Albums;
  albums_assets_assets: AlbumsAssetsAssets;
  albums_shared_users_users: AlbumsSharedUsersUsers;
  api_keys: ApiKeys;
  asset_faces: AssetFaces;
  asset_files: AssetFiles;
  asset_job_status: AssetJobStatus;
  asset_stack: AssetStack;
  assets: Assets;
  audit: Audit;
  exif: Exif;
  face_search: FaceSearch;
  geodata_places: GeodataPlaces;
  libraries: Libraries;
  memories: Memories;
  memories_assets_assets: MemoriesAssetsAssets;
  move_history: MoveHistory;
  naturalearth_countries: NaturalearthCountries;
  partners: Partners;
  person: Person;
  sessions: Sessions;
  shared_link__asset: SharedLinkAsset;
  shared_links: SharedLinks;
  smart_search: SmartSearch;
  system_metadata: SystemMetadata;
  tag_asset: TagAsset;
  tags: Tags;
  tags_closure: TagsClosure;
  user_metadata: UserMetadata;
  users: Users;
  // 'vectors.pg_vector_index_stat': VectorsPgVectorIndexStat;
}
