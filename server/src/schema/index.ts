import { asset_face_source_type, asset_visibility_enum, assets_status_enum } from 'src/schema/enums';
import {
  album_user_after_insert,
  album_users_delete_audit,
  albums_delete_audit,
  assets_delete_audit,
  f_concat_ws,
  f_unaccent,
  immich_uuid_v7,
  ll_to_earth_public,
  memories_delete_audit,
  memory_assets_delete_audit,
  partners_delete_audit,
  stacks_delete_audit,
  updated_at,
  users_delete_audit,
} from 'src/schema/functions';
import { ActivityTable } from 'src/schema/tables/activity.table';
import { AlbumAssetAuditTable } from 'src/schema/tables/album-asset-audit.table';
import { AlbumAssetTable } from 'src/schema/tables/album-asset.table';
import { AlbumAuditTable } from 'src/schema/tables/album-audit.table';
import { AlbumUserAuditTable } from 'src/schema/tables/album-user-audit.table';
import { AlbumUserTable } from 'src/schema/tables/album-user.table';
import { AlbumTable } from 'src/schema/tables/album.table';
import { ApiKeyTable } from 'src/schema/tables/api-key.table';
import { AssetAuditTable } from 'src/schema/tables/asset-audit.table';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { AssetFileTable } from 'src/schema/tables/asset-files.table';
import { AssetJobStatusTable } from 'src/schema/tables/asset-job-status.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { AuditTable } from 'src/schema/tables/audit.table';
import { ExifTable } from 'src/schema/tables/exif.table';
import { FaceSearchTable } from 'src/schema/tables/face-search.table';
import { GeodataPlacesTable } from 'src/schema/tables/geodata-places.table';
import { LibraryTable } from 'src/schema/tables/library.table';
import { MemoryAssetAuditTable } from 'src/schema/tables/memory-asset-audit.table';
import { MemoryAssetTable } from 'src/schema/tables/memory-asset.table';
import { MemoryAuditTable } from 'src/schema/tables/memory-audit.table';
import { MemoryTable } from 'src/schema/tables/memory.table';
import { MoveTable } from 'src/schema/tables/move.table';
import { NaturalEarthCountriesTable } from 'src/schema/tables/natural-earth-countries.table';
import { NotificationTable } from 'src/schema/tables/notification.table';
import { PartnerAuditTable } from 'src/schema/tables/partner-audit.table';
import { PartnerTable } from 'src/schema/tables/partner.table';
import { PersonTable } from 'src/schema/tables/person.table';
import { SessionTable } from 'src/schema/tables/session.table';
import { SharedLinkAssetTable } from 'src/schema/tables/shared-link-asset.table';
import { SharedLinkTable } from 'src/schema/tables/shared-link.table';
import { SmartSearchTable } from 'src/schema/tables/smart-search.table';
import { StackAuditTable } from 'src/schema/tables/stack-audit.table';
import { StackTable } from 'src/schema/tables/stack.table';
import { SessionSyncCheckpointTable } from 'src/schema/tables/sync-checkpoint.table';
import { SystemMetadataTable } from 'src/schema/tables/system-metadata.table';
import { TagAssetTable } from 'src/schema/tables/tag-asset.table';
import { TagClosureTable } from 'src/schema/tables/tag-closure.table';
import { TagTable } from 'src/schema/tables/tag.table';
import { UserAuditTable } from 'src/schema/tables/user-audit.table';
import { UserMetadataTable } from 'src/schema/tables/user-metadata.table';
import { UserTable } from 'src/schema/tables/user.table';
import { VersionHistoryTable } from 'src/schema/tables/version-history.table';
import { Database, Extensions, Generated, Int8 } from 'src/sql-tools';

@Extensions(['uuid-ossp', 'unaccent', 'cube', 'earthdistance', 'pg_trgm', 'plpgsql'])
@Database({ name: 'immich' })
export class ImmichDatabase {
  tables = [
    ActivityTable,
    AlbumAssetTable,
    AlbumAssetAuditTable,
    AlbumAuditTable,
    AlbumUserAuditTable,
    AlbumUserTable,
    AlbumTable,
    ApiKeyTable,
    AssetAuditTable,
    AssetFaceTable,
    AssetJobStatusTable,
    AssetTable,
    AssetFileTable,
    AuditTable,
    ExifTable,
    FaceSearchTable,
    GeodataPlacesTable,
    LibraryTable,
    MemoryTable,
    MemoryAuditTable,
    MemoryAssetTable,
    MemoryAssetAuditTable,
    MoveTable,
    NaturalEarthCountriesTable,
    NotificationTable,
    PartnerAuditTable,
    PartnerTable,
    PersonTable,
    SessionTable,
    SharedLinkAssetTable,
    SharedLinkTable,
    SmartSearchTable,
    StackTable,
    StackAuditTable,
    SessionSyncCheckpointTable,
    SystemMetadataTable,
    TagTable,
    TagAssetTable,
    TagClosureTable,
    UserAuditTable,
    UserMetadataTable,
    UserTable,
    VersionHistoryTable,
  ];

  functions = [
    immich_uuid_v7,
    updated_at,
    f_concat_ws,
    f_unaccent,
    ll_to_earth_public,
    users_delete_audit,
    partners_delete_audit,
    assets_delete_audit,
    albums_delete_audit,
    album_user_after_insert,
    album_users_delete_audit,
    memories_delete_audit,
    memory_assets_delete_audit,
    stacks_delete_audit,
  ];

  enum = [assets_status_enum, asset_face_source_type, asset_visibility_enum];
}

export interface Migrations {
  id: Generated<number>;
  name: string;
  timestamp: Int8;
}

export interface DB {
  activity: ActivityTable;
  albums: AlbumTable;
  albums_audit: AlbumAuditTable;
  albums_assets_assets: AlbumAssetTable;
  album_assets_audit: AlbumAssetAuditTable;
  albums_shared_users_users: AlbumUserTable;
  album_users_audit: AlbumUserAuditTable;
  api_keys: ApiKeyTable;
  asset_faces: AssetFaceTable;
  asset_files: AssetFileTable;
  asset_job_status: AssetJobStatusTable;
  asset_stack: StackTable;
  assets: AssetTable;
  assets_audit: AssetAuditTable;
  audit: AuditTable;
  exif: ExifTable;
  face_search: FaceSearchTable;
  geodata_places: GeodataPlacesTable;
  libraries: LibraryTable;
  memories: MemoryTable;
  memories_audit: MemoryAuditTable;
  memories_assets_assets: MemoryAssetTable;
  memory_assets_audit: MemoryAssetAuditTable;
  migrations: Migrations;
  notifications: NotificationTable;
  move_history: MoveTable;
  naturalearth_countries: NaturalEarthCountriesTable;
  partners_audit: PartnerAuditTable;
  partners: PartnerTable;
  person: PersonTable;
  sessions: SessionTable;
  session_sync_checkpoints: SessionSyncCheckpointTable;
  shared_link__asset: SharedLinkAssetTable;
  shared_links: SharedLinkTable;
  smart_search: SmartSearchTable;
  stacks_audit: StackAuditTable;
  system_metadata: SystemMetadataTable;
  tag_asset: TagAssetTable;
  tags: TagTable;
  tags_closure: TagClosureTable;
  user_metadata: UserMetadataTable;
  users: UserTable;
  users_audit: UserAuditTable;
  version_history: VersionHistoryTable;
}
