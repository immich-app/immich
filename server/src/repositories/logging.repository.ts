import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { isLogLevelEnabled } from '@nestjs/common/services/utils/is-log-level-enabled.util';
import { ClsService } from 'nestjs-cls';
import { Telemetry } from 'src/decorators';
import { LogLevel } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';

const LOG_LEVELS = [LogLevel.VERBOSE, LogLevel.DEBUG, LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];

enum LogColor {
  RED = 31,
  GREEN = 32,
  YELLOW = 33,
  BLUE = 34,
  MAGENTA_BRIGHT = 95,
  CYAN_BRIGHT = 96,
}

@Injectable({ scope: Scope.TRANSIENT })
@Telemetry({ enabled: false })
export class LoggingRepository extends ConsoleLogger {
  private static logLevels: LogLevel[] = [LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
  private noColor: boolean;

  constructor(
    private cls: ClsService,
    configRepository: ConfigRepository,
  ) {
    super(LoggingRepository.name);

    const { noColor } = configRepository.getEnv();
    this.noColor = noColor;
  }

  private static appName?: string = undefined;

  setAppName(name: string): void {
    LoggingRepository.appName = name.charAt(0).toUpperCase() + name.slice(1);
  }

  isLevelEnabled(level: LogLevel) {
    return isLogLevelEnabled(level, LoggingRepository.logLevels);
  }

  setLogLevel(level: LogLevel | false): void {
    LoggingRepository.logLevels = level ? LOG_LEVELS.slice(LOG_LEVELS.indexOf(level)) : [];
  }

  protected formatContext(context: string): string {
    let prefix = LoggingRepository.appName || '';
    if (context) {
      prefix += (prefix ? ':' : '') + context;
    }

    const correlationId = this.cls?.getId();
    if (correlationId) {
      prefix += `~${correlationId}`;
    }

    if (!prefix) {
      return '';
    }

    return this.colors.yellow(`[${prefix}]`) + ' ';
  }

  private colors = {
    red: (text: string) => this.withColor(text, LogColor.RED),
    green: (text: string) => this.withColor(text, LogColor.GREEN),
    yellow: (text: string) => this.withColor(text, LogColor.YELLOW),
    blue: (text: string) => this.withColor(text, LogColor.BLUE),
    magentaBright: (text: string) => this.withColor(text, LogColor.MAGENTA_BRIGHT),
    cyanBright: (text: string) => this.withColor(text, LogColor.CYAN_BRIGHT),
  };

  private withColor(text: string, color: LogColor) {
    return this.noColor ? text : `\u001B[${color}m${text}\u001B[39m`;
  }
}
