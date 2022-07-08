import { InspectOptions } from 'util';

export enum LogLevel {
  Fatal= 0,
  Error= 0,
  Warn= 1,
  Log= 2,
  Info= 3,
  Success= 3,
  Debug= 4,
  Trace= 5,
  Silent= -Infinity,
  Verbose= Infinity,
}

export type logType =
  | 'silent'
  | 'fatal'
  | 'error'
  | 'warn'
  | 'log'
  | 'info'
  | 'success'
  | 'debug'
  | 'trace'
  | 'verbose'
  | 'ready'
  | 'start'

export interface ConsolaLogObject {
  level?: LogLevel,
  tag?: string,
  type?: logType,
  message?: string,
  additional?: string | string[],
  args?: any[],
  date?: Date,
}

export interface ConsolaReporterLogObject {
  level: LogLevel,
  type: logType,
  tag: string;
  args: any[],
  date: Date,
}

type ConsolaMock = (...args: any) => void

type ConsolaMockFn = (type: logType, defaults: ConsolaLogObject) => ConsolaMock

export interface ConsolaReporterArgs {
  async: boolean,
  stdout: NodeJS.WritableStream,
  stderr: NodeJS.WritableStream,
}

export interface ConsolaReporter {
  log: (logObj: ConsolaReporterLogObject, args: ConsolaReporterArgs) => void
}

export interface ConsolaOptions {
  reporters?: ConsolaReporter[],
  types?: { [type in logType]: ConsolaLogObject },
  level?: LogLevel,
  defaults?: ConsolaLogObject,
  async?: boolean,
  stdout?: NodeJS.WritableStream,
  stderr?: NodeJS.WritableStream,
  mockFn?: ConsolaMockFn,
  throttle?: number,
}

export declare class Consola {
  constructor(options: ConsolaOptions)

  level: LogLevel
  readonly stdout: NodeJS.WritableStream
  readonly stderr: NodeJS.WritableStream

  // Built-in log levels
  fatal(message: ConsolaLogObject | any, ...args: any[]): void
  error(message: ConsolaLogObject | any, ...args: any[]): void
  warn(message: ConsolaLogObject | any, ...args: any[]): void
  log(message: ConsolaLogObject | any, ...args: any[]): void
  info(message: ConsolaLogObject | any, ...args: any[]): void
  start(message: ConsolaLogObject | any, ...args: any[]): void
  success(message: ConsolaLogObject | any, ...args: any[]): void
  ready(message: ConsolaLogObject | any, ...args: any[]): void
  debug(message: ConsolaLogObject | any, ...args: any[]): void
  trace(message: ConsolaLogObject | any, ...args: any[]): void

  // Create
  create(options: ConsolaOptions): Consola
  withDefaults(defaults: ConsolaLogObject): Consola

  withTag(tag: string): Consola
  withScope(tag: string): Consola

  // Reporter
  addReporter(reporter: ConsolaReporter): Consola
  setReporters(reporters: Array<ConsolaReporter>): Consola

  removeReporter(reporter?: ConsolaReporter): Consola
  remove(reporter?: ConsolaReporter): Consola
  clear(reporter?: ConsolaReporter): Consola

  // Wrappers
  wrapAll(): void
  restoreAll(): void
  wrapConsole(): void
  restoreConsole(): void
  wrapStd(): void
  restoreStd(): void

  // Pause/Resume
  pauseLogs(): void
  pause(): void

  resumeLogs(): void
  resume(): void

  // Mock
  mockTypes(mockFn: ConsolaMockFn): any
  mock(mockFn: ConsolaMockFn): any
}

export interface BasicReporterOptions {
  dateFormat?: string;
  formatOptions?: InspectOptions;
}

export declare class BasicReporter implements ConsolaReporter {
  protected options: BasicReporterOptions;

  constructor(options?: BasicReporterOptions);

  public log(logObj: ConsolaReporterLogObject, args: ConsolaReporterArgs): void;

  protected formatStack(stack: string): string;
  protected formatArgs(args: any[]): string;
  protected formatDate(date: Date): string;
  protected filterAndJoin(arr: Array<string | undefined>): string;
  protected formatLogObj(logObj: ConsolaReporterLogObject): string;
}

export interface FancyReporterOptions extends BasicReporterOptions{
  secondaryColor?: string;
}

export declare class FancyReporter extends BasicReporter {
  constructor(options?: FancyReporterOptions);

  protected formatType(logObj: ConsolaReporterLogObject): void;
}

export type BrowserReporterOptions = {};

export declare class BrowserReporter implements ConsolaReporter {
  public log(logObj: ConsolaReporterLogObject, args: ConsolaReporterArgs): void;
}

export type JSONReporterOptions = {
  stream?: NodeJS.WritableStream;
};

export declare class JSONReporter implements ConsolaReporter {
  constructor(options?: JSONReporterOptions);
  public log(logObj: ConsolaReporterLogObject, args: ConsolaReporterArgs): void;
}

export type Winston = any;

export declare class WinstonReporter implements ConsolaReporter {
  constructor(logger?: Winston);
  public log(logObj: ConsolaReporterLogObject, args: ConsolaReporterArgs): void;
}

declare const consolaGlobalInstance: Consola;

export default consolaGlobalInstance

