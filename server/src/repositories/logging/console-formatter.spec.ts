import { LogFormat, LogLevel } from 'src/enum';
import { ConsoleFormatter } from 'src/repositories/logging/console-formatter';
import { LogContext } from 'src/repositories/logging/log-formatter.interface';
import { beforeEach, describe, expect, it } from 'vitest';

describe('ConsoleFormatter', () => {
  describe('when color is enabled', () => {
    let sut: ConsoleFormatter;

    beforeEach(() => {
      sut = new ConsoleFormatter(true);
    });

    it('should return true for shouldUseColor', () => {
      expect(sut.shouldUseColor()).toBe(true);
    });

    it('should format log message with color codes', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Log,
        context: 'TestService',
        appName: 'Api',
        message: 'Test message',
      };

      const result = sut.formatMessage(context);

      expect(result).toContain('[Api:TestService]');
      expect(result).toContain('LOG');
      expect(result).toContain('Test message');
      expect(result).toContain('\u001B['); // ANSI color code
    });

    it('should use red color for error level', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Error,
        context: 'ErrorService',
        message: 'Error occurred',
      };

      const result = sut.formatMessage(context);

      expect(result).toContain('\u001B[31m'); // Red color code
      expect(result).toContain('ERROR');
    });

    it('should use red color for fatal level', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Fatal,
        context: 'FatalService',
        message: 'Fatal error',
      };

      const result = sut.formatMessage(context);

      expect(result).toContain('\u001B[31m'); // Red color code
      expect(result).toContain('FATAL');
    });

    it('should use yellow color for warn level', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Warn,
        context: 'WarnService',
        message: 'Warning message',
      };

      const result = sut.formatMessage(context);

      expect(result).toContain('\u001B[33m'); // Yellow color code
      expect(result).toContain('WARN');
    });

    it('should use magenta for debug level', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Debug,
        context: 'DebugService',
        message: 'Debug info',
      };

      const result = sut.formatMessage(context);

      expect(result).toContain('\u001B[95m'); // Magenta color code
      expect(result).toContain('DEBUG');
    });

    it('should use cyan for verbose level', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Verbose,
        context: 'VerboseService',
        message: 'Verbose info',
      };

      const result = sut.formatMessage(context);

      expect(result).toContain('\u001B[96m'); // Cyan color code
      expect(result).toContain('VERBOSE');
    });

    it('should use green for log level', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Log,
        context: 'LogService',
        message: 'Log message',
      };

      const result = sut.formatMessage(context);

      expect(result).toContain('\u001B[32m'); // Green color code
      expect(result).toContain('LOG');
    });

    it('should include app name in prefix', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Log,
        context: 'Service',
        appName: 'Microservices',
        message: 'Message',
      };

      const result = sut.formatMessage(context);

      expect(result).toContain('[Microservices:Service]');
    });

    it('should omit app name from prefix if not provided', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Log,
        context: 'Service',
        message: 'Message',
      };

      const result = sut.formatMessage(context);

      expect(result).toContain('[Service]');
      expect(result).not.toContain('[undefined');
    });

    it('should omit context from prefix if not provided', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Log,
        appName: 'Api',
        message: 'Message',
      };

      const result = sut.formatMessage(context);

      expect(result).toContain('[Api]');
    });
  });

  describe('when color is disabled', () => {
    let sut: ConsoleFormatter;

    beforeEach(() => {
      sut = new ConsoleFormatter(false);
    });

    it('should return false for shouldUseColor', () => {
      expect(sut.shouldUseColor()).toBe(false);
    });

    it('should format message without color codes', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Log,
        context: 'TestService',
        appName: 'Api',
        message: 'Test message',
      };

      const result = sut.formatMessage(context);

      expect(result).toContain('[Api:TestService]');
      expect(result).toContain('LOG');
      expect(result).toContain('Test message');
      expect(result).not.toContain('\u001B['); // No ANSI codes
    });

    it('should still format correctly with all levels', () => {
      const levels = [
        LogLevel.Error,
        LogLevel.Fatal,
        LogLevel.Warn,
        LogLevel.Log,
        LogLevel.Debug,
        LogLevel.Verbose,
      ];

      for (const level of levels) {
        const context: LogContext = {
          timestamp: new Date('2025-12-21T12:00:00.000Z'),
          level,
          context: 'Service',
          message: 'Message',
        };

        const result = sut.formatMessage(context);

        expect(result).toContain('[Service]');
        expect(result).toContain(level.toUpperCase());
        expect(result).toContain('Message');
        expect(result).not.toContain('\u001B['); // No ANSI codes
      }
    });
  });
});
