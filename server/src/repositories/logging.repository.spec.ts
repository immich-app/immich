import { ClsService } from 'nestjs-cls';
import { ImmichWorker } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { mockEnvData, newConfigRepositoryMock } from 'test/repositories/config.repository.mock';
import { Mocked } from 'vitest';

describe(LoggingRepository.name, () => {
  let sut: LoggingRepository;

  let configMock: Mocked<ConfigRepository>;
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

      sut = new LoggingRepository(clsMock, configMock);
      sut.setAppName(ImmichWorker.API);

      expect(sut['formatContext']('context')).toBe('\u001B[33m[Api:context]\u001B[39m ');
    });

    it('should not use colors when noColor is true', () => {
      configMock.getEnv.mockReturnValue(mockEnvData({ noColor: true }));

      sut = new LoggingRepository(clsMock, configMock);
      sut.setAppName(ImmichWorker.API);

      expect(sut['formatContext']('context')).toBe('[Api:context] ');
    });
  });
});
