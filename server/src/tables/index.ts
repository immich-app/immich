import { ActivityTable } from 'src/tables/activity.table';
import { AlbumAssetTable } from 'src/tables/album-asset.table';
import { AlbumUserTable } from 'src/tables/album-user.table';
import { AlbumTable } from 'src/tables/album.table';
import { APIKeyTable } from 'src/tables/api-key.table';
import { AssetAuditTable } from 'src/tables/asset-audit.table';
import { AssetFaceTable } from 'src/tables/asset-face.table';
import { AssetJobStatusTable } from 'src/tables/asset-job-status.table';
import { AssetTable } from 'src/tables/asset.table';
import { AuditTable } from 'src/tables/audit.table';
import { ExifTable } from 'src/tables/exif.table';
import { FaceSearchTable } from 'src/tables/face-search.table';
import { GeodataPlacesTable } from 'src/tables/geodata-places.table';
import { LibraryTable } from 'src/tables/library.table';
import { MemoryTable } from 'src/tables/memory.table';
import { MemoryAssetTable } from 'src/tables/memory_asset.table';
import { MoveTable } from 'src/tables/move.table';
import { NaturalEarthCountriesTable, NaturalEarthCountriesTempTable } from 'src/tables/natural-earth-countries.table';
import { PartnerAuditTable } from 'src/tables/partner-audit.table';
import { PartnerTable } from 'src/tables/partner.table';
import { PersonTable } from 'src/tables/person.table';
import { SessionTable } from 'src/tables/session.table';
import { SharedLinkAssetTable } from 'src/tables/shared-link-asset.table';
import { SharedLinkTable } from 'src/tables/shared-link.table';
import { SmartSearchTable } from 'src/tables/smart-search.table';
import { StackTable } from 'src/tables/stack.table';
import { SessionSyncCheckpointTable } from 'src/tables/sync-checkpoint.table';
import { SystemMetadataTable } from 'src/tables/system-metadata.table';
import { TagAssetTable } from 'src/tables/tag-asset.table';
import { UserAuditTable } from 'src/tables/user-audit.table';
import { UserMetadataTable } from 'src/tables/user-metadata.table';
import { UserTable } from 'src/tables/user.table';
import { VersionHistoryTable } from 'src/tables/version-history.table';

export const tables = [
  ActivityTable,
  AlbumAssetTable,
  AlbumUserTable,
  AlbumTable,
  APIKeyTable,
  AssetAuditTable,
  AssetFaceTable,
  AssetJobStatusTable,
  AssetTable,
  AuditTable,
  ExifTable,
  FaceSearchTable,
  GeodataPlacesTable,
  LibraryTable,
  MemoryAssetTable,
  MemoryTable,
  MoveTable,
  NaturalEarthCountriesTable,
  NaturalEarthCountriesTempTable,
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
  UserAuditTable,
  UserMetadataTable,
  UserTable,
  VersionHistoryTable,
];
