import { asset_face_source_type, asset_visibility_enum, assets_status_enum } from 'src/schema/enums';
import {
  album_delete_audit,
  album_user_after_insert,
  album_user_delete_audit,
  asset_delete_audit,
  asset_face_audit,
  asset_metadata_audit,
  f_concat_ws,
  f_unaccent,
  immich_uuid_v7,
  ll_to_earth_public,
  memory_asset_delete_audit,
  memory_delete_audit,
  partner_delete_audit,
  person_delete_audit,
  stack_delete_audit,
  updated_at,
  user_delete_audit,
  user_metadata_audit,
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
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import { AssetFaceAuditTable } from 'src/schema/tables/asset-face-audit.table';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { AssetFileTable } from 'src/schema/tables/asset-file.table';
import { AssetJobStatusTable } from 'src/schema/tables/asset-job-status.table';
import { AssetMetadataAuditTable } from 'src/schema/tables/asset-metadata-audit.table';
import { AssetMetadataTable } from 'src/schema/tables/asset-metadata.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { AuditTable } from 'src/schema/tables/audit.table';
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
import { PersonAuditTable } from 'src/schema/tables/person-audit.table';
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
import { UserMetadataAuditTable } from 'src/schema/tables/user-metadata-audit.table';
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
    AssetFaceAuditTable,
    AssetMetadataTable,
    AssetMetadataAuditTable,
    AssetJobStatusTable,
    AssetTable,
    AssetFileTable,
    AuditTable,
    AssetExifTable,
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
    PersonAuditTable,
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
    UserMetadataAuditTable,
    UserTable,
    VersionHistoryTable,
  ];

  functions = [
    immich_uuid_v7,
    updated_at,
    f_concat_ws,
    f_unaccent,
    ll_to_earth_public,
    user_delete_audit,
    partner_delete_audit,
    asset_delete_audit,
    album_delete_audit,
    album_user_after_insert,
    album_user_delete_audit,
    memory_delete_audit,
    memory_asset_delete_audit,
    stack_delete_audit,
    person_delete_audit,
    user_metadata_audit,
    asset_metadata_audit,
    asset_face_audit,
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

  album: AlbumTable;
  album_audit: AlbumAuditTable;
  album_asset: AlbumAssetTable;
  album_asset_audit: AlbumAssetAuditTable;
  album_user: AlbumUserTable;
  album_user_audit: AlbumUserAuditTable;

  api_key: ApiKeyTable;

  asset: AssetTable;
  asset_audit: AssetAuditTable;
  asset_exif: AssetExifTable;
  asset_face: AssetFaceTable;
  asset_face_audit: AssetFaceAuditTable;
  asset_file: AssetFileTable;
  asset_metadata: AssetMetadataTable;
  asset_metadata_audit: AssetMetadataAuditTable;
  asset_job_status: AssetJobStatusTable;

  audit: AuditTable;

  face_search: FaceSearchTable;

  geodata_places: GeodataPlacesTable;

  library: LibraryTable;

  memory: MemoryTable;
  memory_audit: MemoryAuditTable;
  memory_asset: MemoryAssetTable;
  memory_asset_audit: MemoryAssetAuditTable;

  migrations: Migrations;

  notification: NotificationTable;

  move_history: MoveTable;

  naturalearth_countries: NaturalEarthCountriesTable;

  partner: PartnerTable;
  partner_audit: PartnerAuditTable;

  person: PersonTable;
  person_audit: PersonAuditTable;

  session: SessionTable;
  session_sync_checkpoint: SessionSyncCheckpointTable;

  shared_link: SharedLinkTable;
  shared_link_asset: SharedLinkAssetTable;

  smart_search: SmartSearchTable;

  stack: StackTable;
  stack_audit: StackAuditTable;

  system_metadata: SystemMetadataTable;

  tag: TagTable;
  tag_asset: TagAssetTable;
  tag_closure: TagClosureTable;

  user: UserTable;
  user_audit: UserAuditTable;
  user_metadata: UserMetadataTable;
  user_metadata_audit: UserMetadataAuditTable;

  version_history: VersionHistoryTable;
}
