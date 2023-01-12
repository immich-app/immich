import { DynamicModule, Global, Module, ModuleMetadata, Provider } from '@nestjs/common';
import { UserService } from './user';

const providers: Provider[] = [
  //
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
