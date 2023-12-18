import { ImmichLogger } from '@app/infra/logger';
import { DynamicModule, Global, Module, ModuleMetadata, Provider } from '@nestjs/common';
import { ActivityService } from './activity';
import { AlbumService } from './album';
import { APIKeyService } from './api-key';
import { AssetService } from './asset';
import { AuditService } from './audit';
import { AuthService } from './auth';
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
import { INITIAL_SYSTEM_CONFIG, SystemConfigService } from './system-config';
import { TagService } from './tag';
import { UserService } from './user';

const providers: Provider[] = [
  ActivityService,
  AlbumService,
  APIKeyService,
  AssetService,
  AuditService,
  AuthService,
  JobService,
  MediaService,
  MetadataService,
  LibraryService,
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
  ImmichLogger,
  {
    provide: INITIAL_SYSTEM_CONFIG,
    inject: [SystemConfigService],
    useFactory: async (configService: SystemConfigService) => {
      return configService.getConfig();
    },
  },
];

@Global()
@Module({})
export class DomainModule {
  static register(options: Pick<ModuleMetadata, 'imports'>): DynamicModule {
    return {
      module: DomainModule,
      imports: options.imports,
      providers: [...providers],
      exports: [...providers],
    };
  }
}
