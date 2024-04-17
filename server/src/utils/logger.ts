import { ConsoleLogger } from '@nestjs/common';
import { isLogLevelEnabled } from '@nestjs/common/services/utils/is-log-level-enabled.util';
import { LogLevel } from 'src/entities/system-config.entity';

const LOG_LEVELS = [LogLevel.VERBOSE, LogLevel.DEBUG, LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];

// TODO move implementation to logger.repository.ts
export class ImmichLogger extends ConsoleLogger {
  private static logLevels: LogLevel[] = [LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];

  constructor(context: string) {
    super(context);
  }

  isLevelEnabled(level: LogLevel) {
    return isLogLevelEnabled(level, ImmichLogger.logLevels);
  }

  static setLogLevel(level: LogLevel | false): void {
    ImmichLogger.logLevels = level === false ? [] : LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));
  }
}
