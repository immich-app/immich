import { asset_face_source_type, assets_status_enum } from 'src/schema/enums';
import {
  assets_delete_audit,
  f_concat_ws,
  f_unaccent,
  immich_uuid_v7,
  ll_to_earth_public,
  partners_delete_audit,
  updated_at,
  users_delete_audit,
} from 'src/schema/functions';
import { ActivityTable } from 'src/schema/tables/activity.table';
import { AlbumAssetTable } from 'src/schema/tables/album-asset.table';
import { AlbumUserTable } from 'src/schema/tables/album-user.table';
import { AlbumTable } from 'src/schema/tables/album.table';
import { APIKeyTable } from 'src/schema/tables/api-key.table';
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
import { MemoryTable } from 'src/schema/tables/memory.table';
import { MemoryAssetTable } from 'src/schema/tables/memory_asset.table';
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
import { StackTable } from 'src/schema/tables/stack.table';
import { SessionSyncCheckpointTable } from 'src/schema/tables/sync-checkpoint.table';
import { SystemMetadataTable } from 'src/schema/tables/system-metadata.table';
import { TagAssetTable } from 'src/schema/tables/tag-asset.table';
import { TagClosureTable } from 'src/schema/tables/tag-closure.table';
import { UserAuditTable } from 'src/schema/tables/user-audit.table';
import { UserMetadataTable } from 'src/schema/tables/user-metadata.table';
import { UserTable } from 'src/schema/tables/user.table';
import { VersionHistoryTable } from 'src/schema/tables/version-history.table';
import { ConfigurationParameter, Database, Extensions } from 'src/sql-tools';

@Extensions(['uuid-ossp', 'unaccent', 'cube', 'earthdistance', 'pg_trgm', 'vectors', 'plpgsql'])
@ConfigurationParameter({ name: 'search_path', value: () => '"$user", public, vectors', scope: 'database' })
@ConfigurationParameter({
  name: 'vectors.pgvector_compatibility',
  value: () => 'on',
  scope: 'user',
  synchronize: false,
})
@Database({ name: 'immich' })
export class ImmichDatabase {
  tables = [
    ActivityTable,
    AlbumAssetTable,
    AlbumUserTable,
    AlbumTable,
    APIKeyTable,
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
    MemoryAssetTable,
    MemoryTable,
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
    SessionSyncCheckpointTable,
    SystemMetadataTable,
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
  ];

  enum = [assets_status_enum, asset_face_source_type];
}
