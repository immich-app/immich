import { LogContext, LogFormatter } from './log-formatter.interface';

enum LogColor {
  RED = 31,
  GREEN = 32,
  YELLOW = 33,
  BLUE = 34,
  MAGENTA_BRIGHT = 95,
  CYAN_BRIGHT = 96,
}

export class ConsoleFormatter implements LogFormatter {
  private colors = {
    red: (text: string) => this.withColor(text, LogColor.RED),
    green: (text: string) => this.withColor(text, LogColor.GREEN),
    yellow: (text: string) => this.withColor(text, LogColor.YELLOW),
    blue: (text: string) => this.withColor(text, LogColor.BLUE),
    magentaBright: (text: string) => this.withColor(text, LogColor.MAGENTA_BRIGHT),
    cyanBright: (text: string) => this.withColor(text, LogColor.CYAN_BRIGHT),
  };

  constructor(private isColorEnabled: boolean) {}

  shouldUseColor(): boolean {
    return this.isColorEnabled;
  }

  formatMessage(context: LogContext): string {
    // Format: [AppName:Context~CorrelationId] LEVEL message
    let prefix = context.appName || '';
    if (context.context) {
      prefix += (prefix ? ':' : '') + context.context;
    }
    if (context.correlationId) {
      prefix += `~${context.correlationId}`;
    }

    let formattedPrefix = '';
    if (prefix) {
      formattedPrefix = this.colors.yellow(`[${prefix}]`) + ' ';
    }

    const levelColor = this.getLevelColor(context.level);
    const formattedLevel = this.colors[levelColor](context.level.toUpperCase());

    return `${formattedPrefix}${formattedLevel} ${context.message}`;
  }

  private getLevelColor(level: string): keyof typeof this.colors {
    switch (level) {
      case 'error':
      case 'fatal':
        return 'red';
      case 'warn':
        return 'yellow';
      case 'debug':
        return 'magentaBright';
      case 'verbose':
        return 'cyanBright';
      default:
        return 'green';
    }
  }

  private withColor(text: string, color: LogColor): string {
    return this.isColorEnabled ? `\u001B[${color}m${text}\u001B[39m` : text;
  }
}
