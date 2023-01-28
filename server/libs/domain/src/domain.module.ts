import { DynamicModule, Global, Module, ModuleMetadata, Provider } from '@nestjs/common';
import { APIKeyService } from './api-key';
import { AuthService } from './auth';
import { JobService } from './job';
import { OAuthService } from './oauth';
import { ShareService } from './share';
import { INITIAL_SYSTEM_CONFIG, SystemConfigService } from './system-config';
import { UserService } from './user';

const providers: Provider[] = [
  APIKeyService,
  AuthService,
  JobService,
  OAuthService,
  SystemConfigService,
  UserService,
  ShareService,
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
