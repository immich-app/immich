import { LogLevel } from 'src/enum';

export interface LogContext {
  timestamp: Date;
  level: LogLevel;
  context?: string;
  appName?: string;
  correlationId?: string;
  message: string;
  stack?: string;
}

export interface LogFormatter {
  formatMessage(context: LogContext): string;
  shouldUseColor(): boolean;
}
