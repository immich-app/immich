import { LogLevel } from '../logger.service';
/**
 * Checks if target level is enabled.
 * @param targetLevel target level
 * @param logLevels array of enabled log levels
 */
export declare function isLogLevelEnabled(targetLevel: LogLevel, logLevels: LogLevel[] | undefined): boolean;
