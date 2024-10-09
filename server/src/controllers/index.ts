import { ActivityController } from 'src/controllers/activity.controller';
import { AlbumController } from 'src/controllers/album.controller';
import { APIKeyController } from 'src/controllers/api-key.controller';
import { AppController } from 'src/controllers/app.controller';
import { AssetMediaController } from 'src/controllers/asset-media.controller';
import { AssetController } from 'src/controllers/asset.controller';
import { AuditController } from 'src/controllers/audit.controller';
import { AuthController } from 'src/controllers/auth.controller';
import { DownloadController } from 'src/controllers/download.controller';
import { DuplicateController } from 'src/controllers/duplicate.controller';
import { FaceController } from 'src/controllers/face.controller';
import { ReportController } from 'src/controllers/file-report.controller';
import { JobController } from 'src/controllers/job.controller';
import { LibraryController } from 'src/controllers/library.controller';
import { MapController } from 'src/controllers/map.controller';
import { MemoryController } from 'src/controllers/memory.controller';
import { NotificationController } from 'src/controllers/notification.controller';
import { OAuthController } from 'src/controllers/oauth.controller';
import { PartnerController } from 'src/controllers/partner.controller';
import { PersonController } from 'src/controllers/person.controller';
import { SearchController } from 'src/controllers/search.controller';
import { ServerController } from 'src/controllers/server.controller';
import { SessionController } from 'src/controllers/session.controller';
import { SharedLinkController } from 'src/controllers/shared-link.controller';
import { StackController } from 'src/controllers/stack.controller';
import { SyncController } from 'src/controllers/sync.controller';
import { SystemConfigController } from 'src/controllers/system-config.controller';
import { SystemMetadataController } from 'src/controllers/system-metadata.controller';
import { TagController } from 'src/controllers/tag.controller';
import { TimelineController } from 'src/controllers/timeline.controller';
import { TrashController } from 'src/controllers/trash.controller';
import { UserAdminController } from 'src/controllers/user-admin.controller';
import { UserController } from 'src/controllers/user.controller';
import { ViewController } from 'src/controllers/view.controller';

export const controllers = [
  APIKeyController,
  ActivityController,
  AlbumController,
  AppController,
  AssetController,
  AssetMediaController,
  AuditController,
  AuthController,
  DownloadController,
  DuplicateController,
  FaceController,
  JobController,
  LibraryController,
  MapController,
  MemoryController,
  NotificationController,
  OAuthController,
  PartnerController,
  PersonController,
  ReportController,
  SearchController,
  ServerController,
  SessionController,
  SharedLinkController,
  StackController,
  SyncController,
  SystemConfigController,
  SystemMetadataController,
  TagController,
  TimelineController,
  TrashController,
  UserAdminController,
  UserController,
  ViewController,
];
