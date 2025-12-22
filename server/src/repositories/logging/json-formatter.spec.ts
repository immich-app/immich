import { LogFormat, LogLevel } from 'src/enum';
import { JsonFormatter } from 'src/repositories/logging/json-formatter';
import { LogContext } from 'src/repositories/logging/log-formatter.interface';
import { beforeEach, describe, expect, it } from 'vitest';

describe('JsonFormatter', () => {
  let sut: JsonFormatter;

  beforeEach(() => {
    sut = new JsonFormatter();
  });

  describe('shouldUseColor', () => {
    it('should return false', () => {
      expect(sut.shouldUseColor()).toBe(false);
    });
  });

  describe('formatMessage', () => {
    it('should format basic log message as JSON', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Log,
        context: 'TestService',
        message: 'Test message',
      };

      const result = sut.formatMessage(context);
      const parsed = JSON.parse(result);

      expect(parsed.timestamp).toBe('2025-12-21T12:00:00.000Z');
      expect(parsed.level).toBe('log');
      expect(parsed.context).toBe('TestService');
      expect(parsed.message).toBe('Test message');
    });

    it('should include stack trace for error level', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Error,
        context: 'ErrorService',
        message: 'Error occurred',
        stack: 'Error: Test\n  at file.ts:10',
      };

      const result = sut.formatMessage(context);
      const parsed = JSON.parse(result);

      expect(parsed.level).toBe('error');
      expect(parsed.stack).toBe('Error: Test\n  at file.ts:10');
    });

    it('should include stack trace for fatal level', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Fatal,
        context: 'FatalService',
        message: 'Fatal error',
        stack: 'Error: Fatal\n  at file.ts:20',
      };

      const result = sut.formatMessage(context);
      const parsed = JSON.parse(result);

      expect(parsed.level).toBe('fatal');
      expect(parsed.stack).toBe('Error: Fatal\n  at file.ts:20');
    });

    it('should not include stack trace for non-error levels', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Debug,
        context: 'DebugService',
        message: 'Debug info',
        stack: 'Should not appear',
      };

      const result = sut.formatMessage(context);
      const parsed = JSON.parse(result);

      expect(parsed.stack).toBeUndefined();
    });

    it('should omit context if not provided', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Log,
        message: 'Message without context',
      };

      const result = sut.formatMessage(context);
      const parsed = JSON.parse(result);

      expect(parsed.context).toBeUndefined();
    });

    it('should always produce valid JSON', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Warn,
        context: 'QuotesService',
        message: 'Message with "quotes" and \\backslashes\\',
      };

      const result = sut.formatMessage(context);

      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should produce single-line output', () => {
      const context: LogContext = {
        timestamp: new Date('2025-12-21T12:00:00.000Z'),
        level: LogLevel.Log,
        context: 'TestService',
        message: 'Multi\nline\nmessage',
      };

      const result = sut.formatMessage(context);

      expect(result).not.toContain('\n');
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });
});
