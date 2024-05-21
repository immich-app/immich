import { ActivityController } from 'src/controllers/activity.controller';
import { AlbumController } from 'src/controllers/album.controller';
import { APIKeyController } from 'src/controllers/api-key.controller';
import { AppController } from 'src/controllers/app.controller';
import { AssetControllerV1 } from 'src/controllers/asset-v1.controller';
import { AssetController } from 'src/controllers/asset.controller';
import { AuditController } from 'src/controllers/audit.controller';
import { AuthController } from 'src/controllers/auth.controller';
import { DownloadController } from 'src/controllers/download.controller';
import { DuplicateController } from 'src/controllers/duplicate.controller';
import { FaceController } from 'src/controllers/face.controller';
import { ReportController } from 'src/controllers/file-report.controller';
import { JobController } from 'src/controllers/job.controller';
import { LibraryController } from 'src/controllers/library.controller';
import { MemoryController } from 'src/controllers/memory.controller';
import { OAuthController } from 'src/controllers/oauth.controller';
import { PartnerController } from 'src/controllers/partner.controller';
import { PersonController } from 'src/controllers/person.controller';
import { SearchController } from 'src/controllers/search.controller';
import { ServerInfoController } from 'src/controllers/server-info.controller';
import { SessionController } from 'src/controllers/session.controller';
import { SharedLinkController } from 'src/controllers/shared-link.controller';
import { SyncController } from 'src/controllers/sync.controller';
import { SystemConfigController } from 'src/controllers/system-config.controller';
import { SystemMetadataController } from 'src/controllers/system-metadata.controller';
import { TagController } from 'src/controllers/tag.controller';
import { TimelineController } from 'src/controllers/timeline.controller';
import { TrashController } from 'src/controllers/trash.controller';
import { UserController } from 'src/controllers/user.controller';

export const controllers = [
  APIKeyController,
  ActivityController,
  AlbumController,
  AppController,
  AssetController,
  AssetControllerV1,
  AuditController,
  AuthController,
  DownloadController,
  DuplicateController,
  FaceController,
  JobController,
  LibraryController,
  MemoryController,
  OAuthController,
  PartnerController,
  PersonController,
  ReportController,
  SearchController,
  ServerInfoController,
  SessionController,
  SharedLinkController,
  SyncController,
  SystemConfigController,
  SystemMetadataController,
  TagController,
  TimelineController,
  TrashController,
  UserController,
];
