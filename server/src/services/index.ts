import { ActivityService } from 'src/services/activity.service.js';
import { AlbumService } from 'src/services/album.service.js';
import { ApiKeyService } from 'src/services/api-key.service.js';
import { ApiService } from 'src/services/api.service.js';
import { AssetFileService } from 'src/services/asset-file.service.js';
import { AssetMediaService } from 'src/services/asset-media.service.js';
import { AssetService } from 'src/services/asset.service.js';
import { AuthAdminService } from 'src/services/auth-admin.service.js';
import { AuthService } from 'src/services/auth.service.js';
import { CliService } from 'src/services/cli.service.js';
import { ClusterGroupService } from 'src/services/cluster-group.service.js';
import { DatabaseBackupService } from 'src/services/database-backup.service.js';
import { DatabaseService } from 'src/services/database.service.js';
import { DownloadService } from 'src/services/download.service.js';
import { DuplicateService } from 'src/services/duplicate.service.js';
import { HlsService } from 'src/services/hls.service.js';
import { IntegrityService } from 'src/services/integrity.service.js';
import { JobService } from 'src/services/job.service.js';
import { LibraryService } from 'src/services/library.service.js';
import { MaintenanceService } from 'src/services/maintenance.service.js';
import { MapService } from 'src/services/map.service.js';
import { MediaService } from 'src/services/media.service.js';
import { MemoryService } from 'src/services/memory.service.js';
import { MetadataService } from 'src/services/metadata.service.js';
import { NotificationAdminService } from 'src/services/notification-admin.service.js';
import { NotificationService } from 'src/services/notification.service.js';
import { OcrService } from 'src/services/ocr.service.js';
import { PartnerService } from 'src/services/partner.service.js';
import { PersonService } from 'src/services/person.service.js';
import { PluginService } from 'src/services/plugin.service.js';
import { QueueService } from 'src/services/queue.service.js';
import { SearchService } from 'src/services/search.service.js';
import { ServerService } from 'src/services/server.service.js';
import { SessionService } from 'src/services/session.service.js';
import { SharedLinkService } from 'src/services/shared-link.service.js';
import { SmartInfoService } from 'src/services/smart-info.service.js';
import { StackService } from 'src/services/stack.service.js';
import { StorageTemplateService } from 'src/services/storage-template.service.js';
import { StorageService } from 'src/services/storage.service.js';
import { SyncService } from 'src/services/sync.service.js';
import { SystemConfigService } from 'src/services/system-config.service.js';
import { SystemMetadataService } from 'src/services/system-metadata.service.js';
import { TagService } from 'src/services/tag.service.js';
import { TelemetryService } from 'src/services/telemetry.service.js';
import { TimelineService } from 'src/services/timeline.service.js';
import { TranscodingService } from 'src/services/transcoding.service.js';
import { TrashService } from 'src/services/trash.service.js';
import { UserAdminService } from 'src/services/user-admin.service.js';
import { UserService } from 'src/services/user.service.js';
import { VersionService } from 'src/services/version.service.js';
import { ViewService } from 'src/services/view.service.js';
import { WorkflowExecutionService } from 'src/services/workflow-execution.service.js';
import { WorkflowService } from 'src/services/workflow.service.js';

export const services = [
  ApiKeyService,
  ActivityService,
  AlbumService,
  ApiService,
  AssetFileService,
  AssetMediaService,
  AssetService,
  AuthService,
  AuthAdminService,
  CliService,
  DatabaseBackupService,
  DatabaseService,
  DownloadService,
  DuplicateService,
  IntegrityService,
  HlsService,
  JobService,
  LibraryService,
  MaintenanceService,
  MapService,
  MediaService,
  MemoryService,
  MetadataService,
  NotificationService,
  NotificationAdminService,
  OcrService,
  ClusterGroupService,
  PartnerService,
  PersonService,
  PluginService,
  QueueService,
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
  TelemetryService,
  TimelineService,
  TranscodingService,
  TrashService,
  UserAdminService,
  UserService,
  VersionService,
  ViewService,
  WorkflowExecutionService,
  WorkflowService,
];
