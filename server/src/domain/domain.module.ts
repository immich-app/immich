import { DynamicModule, Global, Module, ModuleMetadata, OnApplicationShutdown, Provider } from '@nestjs/common';
import { AlbumService } from './album/index.js';
import { APIKeyService } from './api-key/index.js';
import { AssetService } from './asset/index.js';
import { AuthService } from './auth/index.js';
import { FacialRecognitionService } from './facial-recognition/index.js';
import { JobService } from './job/index.js';
import { MediaService } from './media/index.js';
import { MetadataService } from './metadata/index.js';
import { OAuthService } from './oauth/index.js';
import { PartnerService } from './partner/index.js';
import { PersonService } from './person/index.js';
import { SearchService } from './search/index.js';
import { ServerInfoService } from './server-info/index.js';
import { SharedLinkService } from './shared-link/index.js';
import { SmartInfoService } from './smart-info/index.js';
import { StorageTemplateService } from './storage-template/index.js';
import { StorageService } from './storage/index.js';
import { INITIAL_SYSTEM_CONFIG, SystemConfigService } from './system-config/index.js';
import { TagService } from './tag/index.js';
import { UserService } from './user/index.js';

const providers: Provider[] = [
  AlbumService,
  APIKeyService,
  AssetService,
  AuthService,
  FacialRecognitionService,
  JobService,
  MediaService,
  MetadataService,
  OAuthService,
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
export class DomainModule implements OnApplicationShutdown {
  constructor(private searchService: SearchService) {}

  static register(options: Pick<ModuleMetadata, 'imports'>): DynamicModule {
    return {
      module: DomainModule,
      imports: options.imports,
      providers: [...providers],
      exports: [...providers],
    };
  }

  onApplicationShutdown() {
    this.searchService.teardown();
  }
}
