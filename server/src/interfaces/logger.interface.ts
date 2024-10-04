import { ImmichWorker, LogLevel } from 'src/enum';

export const ILoggerRepository = 'ILoggerRepository';

export interface ILoggerRepository {
  setAppName(name: ImmichWorker): void;
  setContext(message: string): void;
  setLogLevel(level: LogLevel | false): void;
  isLevelEnabled(level: LogLevel): boolean;

  verbose(message: any, ...args: any): void;
  debug(message: any, ...args: any): void;
  log(message: any, ...args: any): void;
  warn(message: any, ...args: any): void;
  error(message: any, ...args: any): void;
  fatal(message: any, ...args: any): void;
}
