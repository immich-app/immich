import { ClsService } from 'nestjs-cls';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { LoggerRepository } from 'src/repositories/logger.repository';
import { mockEnvData, newConfigRepositoryMock } from 'test/repositories/config.repository.mock';
import { Mocked } from 'vitest';

describe(LoggerRepository.name, () => {
  let sut: LoggerRepository;

  let configMock: Mocked<IConfigRepository>;
  let clsMock: Mocked<ClsService>;

  beforeEach(() => {
    configMock = newConfigRepositoryMock();
    clsMock = {
      getId: vitest.fn(),
    } as unknown as Mocked<ClsService>;
  });

  describe('formatContext', () => {
    it('should use colors', () => {
      configMock.getEnv.mockReturnValue(mockEnvData({ noColor: false }));

      sut = new LoggerRepository(clsMock, configMock);
      sut.setAppName('api');

      expect(sut['formatContext']('context')).toBe('\u001B[33m[api:context]\u001B[39m ');
    });

    it('should not use colors when noColor is true', () => {
      configMock.getEnv.mockReturnValue(mockEnvData({ noColor: true }));

      sut = new LoggerRepository(clsMock, configMock);
      sut.setAppName('api');

      expect(sut['formatContext']('context')).toBe('[api:context] ');
    });
  });
});
