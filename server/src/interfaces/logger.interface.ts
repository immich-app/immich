import { LogLevel } from 'src/config';

export const ILoggerRepository = 'ILoggerRepository';

export interface ILoggerRepository {
  setAppName(name: string): void;
  setContext(message: string): void;
  setLogLevel(level: LogLevel): void;

  verbose(message: any, ...args: any): void;
  debug(message: any, ...args: any): void;
  log(message: any, ...args: any): void;
  warn(message: any, ...args: any): void;
  error(message: any, ...args: any): void;
  fatal(message: any, ...args: any): void;
}
