import { ConsoleLogger, Inject, Injectable, Scope } from '@nestjs/common';
import { isLogLevelEnabled } from '@nestjs/common/services/utils/is-log-level-enabled.util';
import { ClsService } from 'nestjs-cls';
import { Telemetry } from 'src/decorators';
import { LogFormat, LogLevel } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { ConsoleFormatter } from 'src/repositories/logging/console-formatter';
import { JsonFormatter } from 'src/repositories/logging/json-formatter';
import { LogContext, LogFormatter } from 'src/repositories/logging/log-formatter.interface';

type LogDetails = any;
type LogFunction = () => string;

const LOG_LEVELS = [LogLevel.Verbose, LogLevel.Debug, LogLevel.Log, LogLevel.Warn, LogLevel.Error, LogLevel.Fatal];

enum LogColor {
  RED = 31,
  GREEN = 32,
  YELLOW = 33,
  BLUE = 34,
  MAGENTA_BRIGHT = 95,
  CYAN_BRIGHT = 96,
}

let appName: string | undefined;
let logLevels: LogLevel[] = [LogLevel.Log, LogLevel.Warn, LogLevel.Error, LogLevel.Fatal];

export class MyConsoleLogger extends ConsoleLogger {
  private formatter: LogFormatter;

  constructor(
    private cls: ClsService | undefined,
    options?: { format?: LogFormat; color?: boolean; context?: string },
  ) {
    super(options?.context || MyConsoleLogger.name);

    const format = options?.format || LogFormat.Console;
    const useColor = format === LogFormat.Console ? (options?.color || false) : false;

    this.formatter = format === LogFormat.Json ? new JsonFormatter() : new ConsoleFormatter(useColor);
  }

  isLevelEnabled(level: LogLevel) {
    return isLogLevelEnabled(level, logLevels);
  }

  /**
   * Override printMessages to use custom formatters.
   * This is called by NestJS for all log methods (log, error, warn, etc.).
   */
  protected printMessages(messages: unknown[], context = '', logLevel: LogLevel = LogLevel.Log, writeStreamType?: 'stdout' | 'stderr') {
    const timestamp = new Date();
    const correlationId = this.cls?.getId();

    for (const message of messages) {
      const logContext: LogContext = {
        timestamp,
        level: logLevel,
        context: context || this.context,
        appName,
        correlationId,
        message: this.messageToString(message, logLevel),
        stack: this.extractStack(message),
      };

      const formattedMessage = this.formatter.formatMessage(logContext);

      // Write to appropriate stream
      const stream = writeStreamType === 'stderr' ? process.stderr : process.stdout;
      stream.write(formattedMessage + '\n');
    }
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

    // For backwards compatibility, only use formatter if it supports colors (console formatter)
    if (this.formatter.shouldUseColor()) {
      return `\u001B[${LogColor.YELLOW}m[${prefix}]\u001B[39m `;
    }
    return `[${prefix}] `;
  }

  private messageToString(message: unknown, logLevel: string): string {
    if (message instanceof Error) {
      return message.message;
    }
    return typeof message === 'string' ? message : JSON.stringify(message);
  }

  private extractStack(message: unknown): string | undefined {
    if (message instanceof Error && message.stack) {
      return message.stack;
    }
    return undefined;
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
    let logFormat = LogFormat.Console;

    if (configRepository) {
      const env = configRepository.getEnv();
      noColor = env.noColor;
      logFormat = env.logFormat;
    }

    this.logger = new MyConsoleLogger(cls, {
      context: LoggingRepository.name,
      format: logFormat,
      color: !noColor,
    });
  }

  static create(context?: string) {
    const logger = new LoggingRepository(undefined, undefined);
    if (context) {
      logger.setContext(context);
    }

    return logger;
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
    this.handleMessage(LogLevel.Verbose, message, details);
  }

  verboseFn(message: LogFunction, ...details: LogDetails) {
    this.handleFunction(LogLevel.Verbose, message, details);
  }

  debug(message: string, ...details: LogDetails) {
    this.handleMessage(LogLevel.Debug, message, details);
  }

  debugFn(message: LogFunction, ...details: LogDetails) {
    this.handleFunction(LogLevel.Debug, message, details);
  }

  log(message: string, ...details: LogDetails) {
    this.handleMessage(LogLevel.Log, message, details);
  }

  warn(message: string, ...details: LogDetails) {
    this.handleMessage(LogLevel.Warn, message, details);
  }

  error(message: string | Error, ...details: LogDetails) {
    this.handleMessage(LogLevel.Error, message, details);
  }

  fatal(message: string, ...details: LogDetails) {
    this.handleMessage(LogLevel.Fatal, message, details);
  }

  deprecate(message: string) {
    this.warn(`[Deprecated] ${message}`);
  }

  private handleFunction(level: LogLevel, message: LogFunction, details: LogDetails[]) {
    if (this.logger.isLevelEnabled(level)) {
      this.handleMessage(level, message(), details);
    }
  }

  private handleMessage(level: LogLevel, message: string | Error, details: LogDetails[]) {
    switch (level) {
      case LogLevel.Verbose: {
        this.logger.verbose(message, ...details);
        break;
      }

      case LogLevel.Debug: {
        this.logger.debug(message, ...details);
        break;
      }

      case LogLevel.Log: {
        this.logger.log(message, ...details);
        break;
      }

      case LogLevel.Warn: {
        this.logger.warn(message, ...details);
        break;
      }

      case LogLevel.Error: {
        this.logger.error(message, ...details);
        break;
      }

      case LogLevel.Fatal: {
        this.logger.fatal(message, ...details);
        break;
      }
    }
  }
}
