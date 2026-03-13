import { HttpException, HttpStatus } from '@nestjs/common';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { logGlobalError } from 'src/utils/logger';
import { describe, expect, it, vi } from 'vitest';

const newMockLogger = () =>
  ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    verbose: vi.fn(),
    setContext: vi.fn(),
  }) as unknown as LoggingRepository;

describe('logGlobalError', () => {
  it('should log HttpException at debug level with status and response', () => {
    const logger = newMockLogger();
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    logGlobalError(logger, exception);

    expect(logger.debug).toHaveBeenCalledOnce();
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('HttpException(404)'));
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Not Found'));
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should log HttpException with object response body', () => {
    const logger = newMockLogger();
    const exception = new HttpException({ message: 'Validation failed', errors: ['field required'] }, 422);

    logGlobalError(logger, exception);

    expect(logger.debug).toHaveBeenCalledOnce();
    const message = (logger.debug as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(message).toContain('HttpException(422)');
    expect(message).toContain('Validation failed');
  });

  it('should log generic Error at error level with message and stack', () => {
    const logger = newMockLogger();
    const error = new Error('something broke');

    logGlobalError(logger, error);

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Unknown error'), error.stack);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('something broke'), expect.any(String));
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it('should include the stack trace for generic errors', () => {
    const logger = newMockLogger();
    const error = new Error('stack test');

    logGlobalError(logger, error);

    const stackArg = (logger.error as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(stackArg).toContain('stack test');
  });

  it('should handle an Error subclass that is not HttpException', () => {
    const logger = newMockLogger();

    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const error = new CustomError('custom failure');

    logGlobalError(logger, error);

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Unknown error'), expect.any(String));
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it('should handle HttpException with various status codes', () => {
    const logger = newMockLogger();

    for (const status of [400, 401, 403, 500]) {
      const exception = new HttpException('error', status);
      logGlobalError(logger, exception);
    }

    expect(logger.debug).toHaveBeenCalledTimes(4);
    expect(logger.error).not.toHaveBeenCalled();
  });
});
