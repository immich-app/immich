import { ImmichLogger } from '@app/infra/logger';
import { Global, Module, Provider } from '@nestjs/common';
import { ActivityService } from './activity';
import { AlbumService } from './album';
import { APIKeyService } from './api-key';
import { AssetService } from './asset';
import { AuditService } from './audit';
import { AuthService } from './auth';
import { DatabaseService } from './database';
import { DownloadService } from './download';
import { JobService } from './job';
import { LibraryService } from './library';
import { MediaService } from './media';
import { MetadataService } from './metadata';
import { PartnerService } from './partner';
import { PersonService } from './person';
import { SearchService } from './search';
import { ServerInfoService } from './server-info';
import { SharedLinkService } from './shared-link';
import { SmartInfoService } from './smart-info';
import { StorageService } from './storage';
import { StorageTemplateService } from './storage-template';
import { SystemConfigService } from './system-config';
import { TagService } from './tag';
import { UserService } from './user';

const providers: Provider[] = [
  ActivityService,
  AlbumService,
  APIKeyService,
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
  PersonService,
  PartnerService,
  SearchService,
  ServerInfoService,
  SharedLinkService,
  SmartInfoService,
  StorageService,
  StorageTemplateService,
  SystemConfigService,
  TagService,
  UserService,
];

@Global()
@Module({
  imports: [],
  providers: [...providers],
  exports: [...providers],
})
export class DomainModule {}
