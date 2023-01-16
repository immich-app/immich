import { DomainModule, IKeyRepository, IUserRepository } from '@app/domain';
import { Global, Module, Provider } from '@nestjs/common';

class MockFactory {
  static key(): jest.Mocked<IKeyRepository> {
    return {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getKey: jest.fn(),
      getById: jest.fn(),
      getByUserId: jest.fn(),
    };
  }

  static user(): jest.Mocked<IUserRepository> {
    return {
      get: jest.fn(),
      getAdmin: jest.fn(),
      getByEmail: jest.fn(),
      getByOAuthId: jest.fn(),
      getList: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    };
  }
}

const providers: Provider[] = [
  { provide: IKeyRepository, useFactory: MockFactory.key },
  { provide: IUserRepository, useFactory: MockFactory.user },
];

@Module({
  providers: [...providers],
  exports: [...providers],
})
export class TestProviderModule {}

@Global()
@Module({ imports: [DomainModule.register({ imports: [TestProviderModule] })] })
export class TestModule {}
