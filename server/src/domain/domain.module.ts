import { Global, Module, Provider } from '@nestjs/common';
import { ActivityService } from 'src/domain/activity/activity.service';
import { AlbumService } from 'src/domain/album/album.service';
import { APIKeyService } from 'src/domain/api-key/api-key.service';
import { AssetService } from 'src/domain/asset/asset.service';
import { AuditService } from 'src/domain/audit/audit.service';
import { AuthService } from 'src/domain/auth/auth.service';
import { DatabaseService } from 'src/domain/database/database.service';
import { DownloadService } from 'src/domain/download/download.service';
import { JobService } from 'src/domain/job/job.service';
import { LibraryService } from 'src/domain/library/library.service';
import { MediaService } from 'src/domain/media/media.service';
import { MetadataService } from 'src/domain/metadata/metadata.service';
import { PartnerService } from 'src/domain/partner/partner.service';
import { PersonService } from 'src/domain/person/person.service';
import { SearchService } from 'src/domain/search/search.service';
import { ServerInfoService } from 'src/domain/server-info/server-info.service';
import { SharedLinkService } from 'src/domain/shared-link/shared-link.service';
import { SmartInfoService } from 'src/domain/smart-info/smart-info.service';
import { StorageTemplateService } from 'src/domain/storage-template/storage-template.service';
import { StorageService } from 'src/domain/storage/storage.service';
import { SystemConfigService } from 'src/domain/system-config/system-config.service';
import { TagService } from 'src/domain/tag/tag.service';
import { TrashService } from 'src/domain/trash/trash.service';
import { UserService } from 'src/domain/user/user.service';
import { ImmichLogger } from 'src/infra/logger';

const providers: Provider[] = [
  APIKeyService,
  ActivityService,
  AlbumService,
  AssetService,
  AuditService,
  AuthService,
  DatabaseService,
  DownloadService,
  ImmichLogger,
  JobService,
  LibraryService,
  MediaService,
  MetadataService,
  PartnerService,
  PersonService,
  SearchService,
  ServerInfoService,
  SharedLinkService,
  SmartInfoService,
  StorageService,
  StorageTemplateService,
  SystemConfigService,
  TagService,
  TrashService,
  UserService,
];

@Global()
@Module({
  imports: [],
  providers: [...providers],
  exports: [...providers],
})
export class DomainModule {}
