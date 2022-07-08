import { LogLevel } from './logLevels'

export default {
  // Silent
  silent: {
    level: -1
  },
  // Level 0
  fatal: {
    level: LogLevel.Fatal
  },
  error: {
    level: LogLevel.Error
  },
  // Level 1
  warn: {
    level: LogLevel.Warn
  },
  // Level 2
  log: {
    level: LogLevel.Log
  },
  // Level 3
  info: {
    level: LogLevel.Info
  },
  success: {
    level: LogLevel.Success
  },
  // Level 4
  debug: {
    level: LogLevel.Debug
  },
  // Level 5
  trace: {
    level: LogLevel.Trace
  },
  // Verbose
  verbose: {
    level: LogLevel.Trace
  },

  // Legacy
  ready: {
    level: LogLevel.Info
  },
  start: {
    level: LogLevel.Info
  }
}
