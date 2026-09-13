import { ClsService } from 'nestjs-cls';
import { ImmichWorker } from 'src/enum.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { LoggingRepository, MyConsoleLogger } from 'src/repositories/logging.repository.js';
import { newConfigRepositoryMock } from 'test/repositories/config.repository.mock.js';
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
        sut.setAppName(ImmichWorker.Api);

        const logger = new MyConsoleLogger(clsMock, { color: true });

        expect(logger.formatContext('context')).toBe('\u{1B}[33m[Api:context]\u{1B}[39m ');
      });

      it('should not use colors when color is false', () => {
        sut = new LoggingRepository(clsMock, configMock);
        sut.setAppName(ImmichWorker.Api);

        const logger = new MyConsoleLogger(clsMock, { color: false });

        expect(logger.formatContext('context')).toBe('[Api:context] ');
      });
    });
  });
});
