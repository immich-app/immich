import { LogContext, LogFormatter } from './log-formatter.interface';

export class JsonFormatter implements LogFormatter {
  shouldUseColor(): boolean {
    return false;
  }

  formatMessage(context: LogContext): string {
    const logObject: Record<string, any> = {
      timestamp: context.timestamp.toISOString(),
      level: context.level,
      message: context.message,
    };

    // Add context if present
    if (context.context) {
      logObject.context = context.context;
    }

    // Add stack trace for error/fatal levels if present
    if ((context.level === 'error' || context.level === 'fatal') && context.stack) {
      logObject.stack = context.stack;
    }

    // Serialize to JSON (single line)
    return JSON.stringify(logObject);
  }
}
