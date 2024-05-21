import { ActivityService } from 'src/services/activity.service';
import { AlbumService } from 'src/services/album.service';
import { APIKeyService } from 'src/services/api-key.service';
import { ApiService } from 'src/services/api.service';
import { AssetServiceV1 } from 'src/services/asset-v1.service';
import { AssetService } from 'src/services/asset.service';
import { AuditService } from 'src/services/audit.service';
import { AuthService } from 'src/services/auth.service';
import { DatabaseService } from 'src/services/database.service';
import { DownloadService } from 'src/services/download.service';
import { DuplicateService } from 'src/services/duplicate.service';
import { JobService } from 'src/services/job.service';
import { LibraryService } from 'src/services/library.service';
import { MediaService } from 'src/services/media.service';
import { MemoryService } from 'src/services/memory.service';
import { MetadataService } from 'src/services/metadata.service';
import { MicroservicesService } from 'src/services/microservices.service';
import { NotificationService } from 'src/services/notification.service';
import { PartnerService } from 'src/services/partner.service';
import { PersonService } from 'src/services/person.service';
import { SearchService } from 'src/services/search.service';
import { ServerInfoService } from 'src/services/server-info.service';
import { SessionService } from 'src/services/session.service';
import { SharedLinkService } from 'src/services/shared-link.service';
import { SmartInfoService } from 'src/services/smart-info.service';
import { StorageTemplateService } from 'src/services/storage-template.service';
import { StorageService } from 'src/services/storage.service';
import { SyncService } from 'src/services/sync.service';
import { SystemConfigService } from 'src/services/system-config.service';
import { SystemMetadataService } from 'src/services/system-metadata.service';
import { TagService } from 'src/services/tag.service';
import { TimelineService } from 'src/services/timeline.service';
import { TrashService } from 'src/services/trash.service';
import { UserService } from 'src/services/user.service';
import { VersionService } from 'src/services/version.service';

export const services = [
  ApiService,
  MicroservicesService,
  APIKeyService,
  ActivityService,
  AlbumService,
  AssetService,
  AssetServiceV1,
  AuditService,
  AuthService,
  DatabaseService,
  DownloadService,
  DuplicateService,
  JobService,
  LibraryService,
  MediaService,
  MemoryService,
  MetadataService,
  NotificationService,
  PartnerService,
  PersonService,
  SearchService,
  ServerInfoService,
  SessionService,
  SharedLinkService,
  SmartInfoService,
  StorageService,
  StorageTemplateService,
  SyncService,
  SystemConfigService,
  SystemMetadataService,
  TagService,
  TimelineService,
  TrashService,
  UserService,
  VersionService,
];
