import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { isLogLevelEnabled } from '@nestjs/common/services/utils/is-log-level-enabled.util';
import { ClsService } from 'nestjs-cls';
import { LogLevel } from 'src/config';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { LogColor } from 'src/utils/logger-colors';

const LOG_LEVELS = [LogLevel.VERBOSE, LogLevel.DEBUG, LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerRepository extends ConsoleLogger implements ILoggerRepository {
  private static logLevels: LogLevel[] = [LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];

  constructor(private cls: ClsService) {
    super(LoggerRepository.name);
  }

  private static appName?: string = undefined;

  setAppName(name: string): void {
    LoggerRepository.appName = name;
  }

  isLevelEnabled(level: LogLevel) {
    return isLogLevelEnabled(level, LoggerRepository.logLevels);
  }

  setLogLevel(level: LogLevel): void {
    LoggerRepository.logLevels = LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));
  }

  protected formatContext(context: string): string {
    let formattedContext = super.formatContext(context);

    const correlationId = this.cls?.getId();
    if (correlationId && this.isLevelEnabled(LogLevel.VERBOSE)) {
      formattedContext += `[${correlationId}] `;
    }

    if (LoggerRepository.appName) {
      formattedContext = LogColor.blue(`[${LoggerRepository.appName}] `) + formattedContext;
    }

    return formattedContext;
  }
}
