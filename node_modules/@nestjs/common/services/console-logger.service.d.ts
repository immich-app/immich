import { LoggerService, LogLevel } from './logger.service';
export interface ConsoleLoggerOptions {
    /**
     * Enabled log levels.
     */
    logLevels?: LogLevel[];
    /**
     * If enabled, will print timestamp (time difference) between current and previous log message.
     */
    timestamp?: boolean;
}
export declare class ConsoleLogger implements LoggerService {
    protected context?: string;
    protected options: ConsoleLoggerOptions;
    private static lastTimestampAt?;
    private originalContext?;
    constructor();
    constructor(context: string);
    constructor(context: string, options: ConsoleLoggerOptions);
    /**
     * Write a 'log' level log, if the configured level allows for it.
     * Prints to `stdout` with newline.
     */
    log(message: any, context?: string): void;
    log(message: any, ...optionalParams: [...any, string?]): void;
    /**
     * Write an 'error' level log, if the configured level allows for it.
     * Prints to `stderr` with newline.
     */
    error(message: any, stack?: string, context?: string): void;
    error(message: any, ...optionalParams: [...any, string?, string?]): void;
    /**
     * Write a 'warn' level log, if the configured level allows for it.
     * Prints to `stdout` with newline.
     */
    warn(message: any, context?: string): void;
    warn(message: any, ...optionalParams: [...any, string?]): void;
    /**
     * Write a 'debug' level log, if the configured level allows for it.
     * Prints to `stdout` with newline.
     */
    debug(message: any, context?: string): void;
    debug(message: any, ...optionalParams: [...any, string?]): void;
    /**
     * Write a 'verbose' level log, if the configured level allows for it.
     * Prints to `stdout` with newline.
     */
    verbose(message: any, context?: string): void;
    verbose(message: any, ...optionalParams: [...any, string?]): void;
    /**
     * Set log levels
     * @param levels log levels
     */
    setLogLevels(levels: LogLevel[]): void;
    /**
     * Set logger context
     * @param context context
     */
    setContext(context: string): void;
    /**
     * Resets the logger context to the value that was passed in the constructor.
     */
    resetContext(): void;
    isLevelEnabled(level: LogLevel): boolean;
    protected getTimestamp(): string;
    protected printMessages(messages: unknown[], context?: string, logLevel?: LogLevel, writeStreamType?: 'stdout' | 'stderr'): void;
    protected formatPid(pid: number): string;
    protected formatMessage(logLevel: LogLevel, message: unknown, pidMessage: string, formattedLogLevel: string, contextMessage: string, timestampDiff: string): string;
    protected stringifyMessage(message: unknown, logLevel: LogLevel): string;
    protected colorize(message: string, logLevel: LogLevel): string;
    protected printStackTrace(stack: string): void;
    private updateAndGetTimestampDiff;
    private getContextAndMessagesToPrint;
    private getContextAndStackAndMessagesToPrint;
    private getColorByLogLevel;
}
