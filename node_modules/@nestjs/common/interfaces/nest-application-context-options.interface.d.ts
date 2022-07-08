import { LoggerService, LogLevel } from '../services/logger.service';
/**
 * @publicApi
 */
export declare class NestApplicationContextOptions {
    /**
     * Specifies the logger to use.  Pass `false` to turn off logging.
     */
    logger?: LoggerService | LogLevel[] | false;
    /**
     * Whether to abort the process on Error. By default, the process is exited.
     * Pass `false` to override the default behavior. If `false` is passed, Nest will not exit
     * the application and instead will rethrow the exception.
     * @default true
     */
    abortOnError?: boolean | undefined;
    /**
     * If enabled, logs will be buffered until the "Logger#flush" method is called.
     * @default false
     */
    bufferLogs?: boolean;
    /**
     * If enabled, logs will be automatically flushed and buffer detached when
     * application initialisation process either completes or fails.
     * @default true
     */
    autoFlushLogs?: boolean;
}
