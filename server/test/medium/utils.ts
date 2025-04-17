import { Provider } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import { ClassConstructor } from 'class-transformer';
import { ClsService } from 'nestjs-cls';
import { middleware } from 'src/app.module';
import { controllers } from 'src/controllers';
import { GlobalExceptionFilter } from 'src/middleware/global-exception.filter';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { services } from 'src/services';
import { ApiService } from 'src/services/api.service';
import { AuthService } from 'src/services/auth.service';
import { BaseService } from 'src/services/base.service';
import { automock } from 'test/utils';
import { Mocked } from 'vitest';

export const createControllerTestApp = async (options?: { authType?: 'mock' | 'real' }) => {
  const { authType = 'mock' } = options || {};

  const configMock = { getEnv: () => ({ noColor: true }) };
  const clsMock = { getId: vitest.fn().mockReturnValue('cls-id') };
  const loggerMock = automock(LoggingRepository, { args: [clsMock, configMock], strict: false });
  loggerMock.setContext.mockReturnValue(void 0);
  loggerMock.error.mockImplementation((...args: any[]) => {
    console.log('Logger.error was called with', ...args);
  });

  const mockBaseService = (service: ClassConstructor<BaseService>) => {
    return automock(service, { args: [loggerMock], strict: false });
  };

  const clsServiceMock = clsMock;

  const FAKE_MOCK = vitest.fn();

  const providers: Provider[] = [
    ...middleware,
    ...services.map((Service) => {
      if ((authType === 'real' && Service === AuthService) || Service === ApiService) {
        return Service;
      }
      return { provide: Service, useValue: mockBaseService(Service as ClassConstructor<BaseService>) };
    }),
    GlobalExceptionFilter,
    { provide: LoggingRepository, useValue: loggerMock },
    { provide: ClsService, useValue: clsServiceMock },
  ];

  const moduleRef = await Test.createTestingModule({
    imports: [],
    controllers: [...controllers],
    providers,
  })
    .useMocker((token) => {
      if (token === LoggingRepository) {
        return;
      }

      if (token === SchedulerRegistry) {
        return FAKE_MOCK;
      }

      if (typeof token === 'function' && token.name.endsWith('Repository')) {
        return FAKE_MOCK;
      }

      if (typeof token === 'string' && token === 'KyselyModuleConnectionToken') {
        return FAKE_MOCK;
      }
    })

    .compile();

  const app = moduleRef.createNestApplication();

  await app.init();

  const getMockedRepository = <T>(token: ClassConstructor<T>) => {
    return app.get(token) as Mocked<T>;
  };

  return {
    getHttpServer: () => app.getHttpServer(),
    getMockedService: <T>(token: ClassConstructor<T>) => {
      if (authType === 'real' && token === AuthService) {
        throw new Error('Auth type is real, cannot get mocked service');
      }
      return app.get(token) as Mocked<T>;
    },
    getMockedRepository,
    close: () => app.close(),
  };
};

export type TestControllerApp = {
  getHttpServer: () => any;
  getMockedService: <T>(token: ClassConstructor<T>) => Mocked<T>;
  getMockedRepository: <T>(token: ClassConstructor<T>) => Mocked<T>;
  close: () => Promise<void>;
};
