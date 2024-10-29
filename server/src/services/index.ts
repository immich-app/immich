import { ActivityService } from 'src/services/activity.service';
import { AlbumService } from 'src/services/album.service';
import { APIKeyService } from 'src/services/api-key.service';
import { ApiService } from 'src/services/api.service';
import { AssetMediaService } from 'src/services/asset-media.service';
import { AssetService } from 'src/services/asset.service';
import { AuditService } from 'src/services/audit.service';
import { AuthService } from 'src/services/auth.service';
import { CliService } from 'src/services/cli.service';
import { DatabaseService } from 'src/services/database.service';
import { DownloadService } from 'src/services/download.service';
import { DuplicateService } from 'src/services/duplicate.service';
import { JobService } from 'src/services/job.service';
import { LibraryService } from 'src/services/library.service';
import { MapService } from 'src/services/map.service';
import { MediaService } from 'src/services/media.service';
import { MemoryService } from 'src/services/memory.service';
import { MetadataService } from 'src/services/metadata.service';
import { MicroservicesService } from 'src/services/microservices.service';
import { NotificationService } from 'src/services/notification.service';
import { PartnerService } from 'src/services/partner.service';
import { PersonService } from 'src/services/person.service';
import { SearchService } from 'src/services/search.service';
import { ServerService } from 'src/services/server.service';
import { SessionService } from 'src/services/session.service';
import { SharedLinkService } from 'src/services/shared-link.service';
import { SmartInfoService } from 'src/services/smart-info.service';
import { StackService } from 'src/services/stack.service';
import { StorageTemplateService } from 'src/services/storage-template.service';
import { StorageService } from 'src/services/storage.service';
import { SyncService } from 'src/services/sync.service';
import { SystemConfigService } from 'src/services/system-config.service';
import { SystemMetadataService } from 'src/services/system-metadata.service';
import { TagService } from 'src/services/tag.service';
import { TimelineService } from 'src/services/timeline.service';
import { TrashService } from 'src/services/trash.service';
import { UserAdminService } from 'src/services/user-admin.service';
import { UserService } from 'src/services/user.service';
import { VersionService } from 'src/services/version.service';
import { ViewService } from 'src/services/view.service';

export const services = [
  APIKeyService,
  ActivityService,
  AlbumService,
  ApiService,
  AssetMediaService,
  AssetService,
  AuditService,
  AuthService,
  CliService,
  DatabaseService,
  DownloadService,
  DuplicateService,
  JobService,
  LibraryService,
  MapService,
  MediaService,
  MemoryService,
  MetadataService,
  MicroservicesService,
  NotificationService,
  PartnerService,
  PersonService,
  SearchService,
  ServerService,
  SessionService,
  SharedLinkService,
  SmartInfoService,
  StackService,
  StorageService,
  StorageTemplateService,
  SyncService,
  SystemConfigService,
  SystemMetadataService,
  TagService,
  TimelineService,
  TrashService,
  UserAdminService,
  UserService,
  VersionService,
  ViewService,
];
