import { ClsService } from 'nestjs-cls';
import { ImmichWorker } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository, MyConsoleLogger } from 'src/repositories/logging.repository';
import { newConfigRepositoryMock } from 'test/repositories/config.repository.mock';
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

  describe(MyConsoleLogger.name, () => {
    describe('formatContext', () => {
      it('should use colors', () => {
        sut = new LoggingRepository(clsMock, configMock);
        sut.setAppName(ImmichWorker.API);

        const logger = new MyConsoleLogger(clsMock, { color: true });

        expect(logger.formatContext('context')).toBe('\u001B[33m[Api:context]\u001B[39m ');
      });

      it('should not use colors when color is false', () => {
        sut = new LoggingRepository(clsMock, configMock);
        sut.setAppName(ImmichWorker.API);

        const logger = new MyConsoleLogger(clsMock, { color: false });

        expect(logger.formatContext('context')).toBe('[Api:context] ');
      });
    });
  });
});
