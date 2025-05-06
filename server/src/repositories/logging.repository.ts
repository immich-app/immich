import { ConsoleLogger, Inject, Injectable, Scope } from '@nestjs/common';
import { isLogLevelEnabled } from '@nestjs/common/services/utils/is-log-level-enabled.util';
import { ClsService } from 'nestjs-cls';
import { Telemetry } from 'src/decorators';
import { LogLevel } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';

type LogDetails = any[];
type LogFunction = () => string;

const LOG_LEVELS = [LogLevel.VERBOSE, LogLevel.DEBUG, LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];

enum LogColor {
  RED = 31,
  GREEN = 32,
  YELLOW = 33,
  BLUE = 34,
  MAGENTA_BRIGHT = 95,
  CYAN_BRIGHT = 96,
}

let appName: string | undefined;
let logLevels: LogLevel[] = [LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];

export class MyConsoleLogger extends ConsoleLogger {
  private isColorEnabled: boolean;

  constructor(
    private cls: ClsService | undefined,
    options?: { color?: boolean; context?: string },
  ) {
    super(options?.context || MyConsoleLogger.name);
    this.isColorEnabled = options?.color || false;
  }

  isLevelEnabled(level: LogLevel) {
    return isLogLevelEnabled(level, logLevels);
  }

  formatContext(context: string): string {
    let prefix = appName || '';
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
    return this.isColorEnabled ? `\u001B[${color}m${text}\u001B[39m` : text;
  }
}

@Injectable({ scope: Scope.TRANSIENT })
@Telemetry({ enabled: false })
export class LoggingRepository {
  private logger: MyConsoleLogger;

  constructor(
    @Inject(ClsService) cls: ClsService | undefined,
    @Inject(ConfigRepository) configRepository: ConfigRepository | undefined,
  ) {
    let noColor = false;
    if (configRepository) {
      noColor = configRepository.getEnv().noColor;
    }
    this.logger = new MyConsoleLogger(cls, { context: LoggingRepository.name, color: !noColor });
  }

  static create() {
    return new LoggingRepository(undefined, undefined);
  }

  setAppName(name: string): void {
    appName = name.charAt(0).toUpperCase() + name.slice(1);
  }

  setContext(context: string) {
    this.logger.setContext(context);
  }

  isLevelEnabled(level: LogLevel) {
    return this.logger.isLevelEnabled(level);
  }

  setLogLevel(level: LogLevel | false): void {
    logLevels = level ? LOG_LEVELS.slice(LOG_LEVELS.indexOf(level)) : [];
  }

  verbose(message: string, ...details: LogDetails) {
    this.handleMessage(LogLevel.VERBOSE, message, details);
  }

  verboseFn(message: LogFunction, ...details: LogDetails) {
    this.handleFunction(LogLevel.VERBOSE, message, details);
  }

  debug(message: string, ...details: LogDetails) {
    this.handleMessage(LogLevel.DEBUG, message, details);
  }

  debugFn(message: LogFunction, ...details: LogDetails) {
    this.handleFunction(LogLevel.DEBUG, message, details);
  }

  log(message: string, ...details: LogDetails) {
    this.handleMessage(LogLevel.LOG, message, details);
  }

  warn(message: string, ...details: LogDetails) {
    this.handleMessage(LogLevel.WARN, message, details);
  }

  error(message: string | Error, ...details: LogDetails) {
    this.handleMessage(LogLevel.ERROR, message, details);
  }

  fatal(message: string, ...details: LogDetails) {
    this.handleMessage(LogLevel.FATAL, message, details);
  }

  private handleFunction(level: LogLevel, message: LogFunction, details: LogDetails[]) {
    if (this.logger.isLevelEnabled(level)) {
      this.handleMessage(level, message(), details);
    }
  }

  private handleMessage(level: LogLevel, message: string | Error, details: LogDetails[]) {
    switch (level) {
      case LogLevel.VERBOSE: {
        this.logger.verbose(message, ...details);
        break;
      }

      case LogLevel.DEBUG: {
        this.logger.debug(message, ...details);
        break;
      }

      case LogLevel.LOG: {
        this.logger.log(message, ...details);
        break;
      }

      case LogLevel.WARN: {
        this.logger.warn(message, ...details);
        break;
      }

      case LogLevel.ERROR: {
        this.logger.error(message, ...details);
        break;
      }

      case LogLevel.FATAL: {
        this.logger.fatal(message, ...details);
        break;
      }
    }
  }
}
