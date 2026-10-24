import { Controller, ForbiddenException, Get, UnauthorizedException } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import request from 'supertest';
import { Authenticated } from 'src/middleware/auth.guard.js';
import { ErrorInterceptor } from 'src/middleware/error.interceptor.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { PrivateRequest } from 'src/utils/private-request.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { ControllerContext, controllerSetup } from 'test/utils.js';

const privateError = new Error('private-album-id: summer secret; SQL params: private-owner-id');

@Controller('private-request-test')
@PrivateRequest(true)
class PrivateTestController {
  @Get(':id')
  @Authenticated()
  getPrivateAlbum() {
    throw privateError;
  }

  @Get('ordinary/:id')
  @Authenticated()
  @PrivateRequest(false)
  getOrdinaryAlbum() {
    throw privateError;
  }
}

describe('Private route guards and error handling', () => {
  let ctx: ControllerContext;
  const logger = { setContext: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() };

  beforeAll(async () => {
    ctx = await controllerSetup(PrivateTestController, [
      { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
      { provide: LoggingRepository, useValue: logger },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    ctx.reset();
  });

  it.each([new UnauthorizedException('Expired session'), new ForbiddenException('Rejected shared link')])(
    'sets no-store before authentication rejects with %s',
    async (error) => {
      ctx.authenticate.mockRejectedValue(error);
      const response = await request(ctx.getHttpServer()).get('/private-request-test/private-album-id');
      expect(response.status).toBe(error.getStatus());
      expect(response.headers['cache-control']).toBe('no-store');
      expect(ctx.authenticate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ privateRoute: true }),
        }),
      );
    },
  );

  it('does not change cache policy or privacy metadata on ordinary routes', async () => {
    ctx.authenticate.mockRejectedValue(new UnauthorizedException());
    const response = await request(ctx.getHttpServer()).get('/private-request-test/ordinary/ordinary-id');
    expect(response.status).toBe(401);
    expect(response.headers['cache-control']).toBeUndefined();
    expect(ctx.authenticate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ privateRoute: false }),
      }),
    );
  });

  it('suppresses unknown private error details and retains generic internal error output', async () => {
    ctx.authenticate.mockResolvedValue(AuthFactory.from().session().build());
    const response = await request(ctx.getHttpServer()).get('/private-request-test/private-album-id');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Failed to get private album' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(logger.error).toHaveBeenCalledExactlyOnceWith('Unknown error on private request');
    expect(JSON.stringify([logger.error.mock.calls, logger.debug.mock.calls])).not.toContain('summer secret');
    expect(JSON.stringify([logger.error.mock.calls, logger.debug.mock.calls])).not.toContain('private-owner-id');
  });

  it('preserves ordinary unknown error diagnostics', async () => {
    ctx.authenticate.mockResolvedValue(AuthFactory.from().session().build());
    const response = await request(ctx.getHttpServer()).get('/private-request-test/ordinary/ordinary-id');
    expect(response.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith(`Unknown error: ${privateError}`, privateError.stack);
  });
});
