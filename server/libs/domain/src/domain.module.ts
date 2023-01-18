import { DynamicModule, Global, Module, ModuleMetadata, Provider } from '@nestjs/common';
import { APIKeyService } from './api-key';
import { UserService } from './user';

const providers: Provider[] = [
  //
  APIKeyService,
  UserService,
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
