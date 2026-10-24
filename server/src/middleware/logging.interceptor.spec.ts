import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of, throwError } from 'rxjs';
import { LoggingInterceptor } from 'src/middleware/logging.interceptor.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { PrivateRequest } from 'src/utils/private-request.js';

@PrivateRequest(true)
class PrivateController {
  handle() {}
}

class OrdinaryController {
  handle() {}
}

const setup = (isPrivate: boolean) => {
  const logger = { setContext: vi.fn(), debug: vi.fn(), verbose: vi.fn() };
  const response = { statusCode: 200, setHeader: vi.fn() };
  const context = {
    getClass: () => (isPrivate ? PrivateController : OrdinaryController),
    getHandler: () => (isPrivate ? PrivateController.prototype.handle : OrdinaryController.prototype.handle),
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        ip: '127.0.0.1',
        url: '/locked-albums/private-album-id/assets?skip=0&take=50',
        body: {
          albumName: 'Private medical documents',
          ids: ['private-asset-id'],
          password: 'secret',
          pinCode: '123456',
          newPinCode: '654321',
        },
      }),
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
  return {
    sut: new LoggingInterceptor(logger as unknown as LoggingRepository, new Reflector()),
    context,
    logger,
    response,
  };
};

describe(LoggingInterceptor.name, () => {
  it('should suppress private URLs and bodies and disable response caching', async () => {
    const { sut, context, logger, response } = setup(true);
    await lastValueFrom(sut.intercept(context, { handle: () => of('result') }));

    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(logger.verbose).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('POST [private request] 200'));
    expect(JSON.stringify(logger.debug.mock.calls)).not.toMatch(/private-album-id|private-asset-id|medical|skip=/u);
  });

  it('should suppress sensitive logs and disable caching when a private handler fails', async () => {
    const { sut, context, logger, response } = setup(true);
    await expect(
      lastValueFrom(sut.intercept(context, { handle: () => throwError(() => new Error('Failure')) })),
    ).rejects.toThrow('Failure');

    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(logger.verbose).not.toHaveBeenCalled();
    expect(JSON.stringify(logger.debug.mock.calls)).not.toContain('private-album-id');
  });

  it('should preserve ordinary request logging and password redaction', async () => {
    const { sut, context, logger, response } = setup(false);
    await lastValueFrom(sut.intercept(context, { handle: () => of('result') }));

    expect(response.setHeader).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('/locked-albums/private-album-id/assets?'));
    expect(logger.verbose).toHaveBeenCalledOnce();
    expect(logger.verbose.mock.calls[0][0]).toContain('"password":"********"');
    expect(logger.verbose.mock.calls[0][0]).not.toContain('secret');
    expect(logger.verbose.mock.calls[0][0]).not.toContain('123456');
    expect(logger.verbose.mock.calls[0][0]).not.toContain('654321');
    expect(logger.verbose.mock.calls[0][0]).toContain('"pinCode":"********"');
  });
});
