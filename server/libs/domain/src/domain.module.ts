import { DynamicModule, Global, Module, ModuleMetadata, Provider } from '@nestjs/common';

const providers: Provider[] = [];

@Global()
@Module({})
export class DomainModule {
  static register(options: Pick<ModuleMetadata, 'imports'>): DynamicModule {
    const imports = options.imports || [];
    return {
      module: DomainModule,
      imports: [...imports],
      providers: [...providers],
      exports: [...providers, ...imports],
    };
  }
}
