import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Authenticated, AuthGuard } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { AuthService } from 'src/services/auth.service';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { newTestService, ServiceMocks } from 'test/utils';

class TestController {
  @Authenticated({ public: true, setup: true })
  setupRoute() {}

  @Authenticated({ public: true })
  publicRoute() {}

  undecoratedRoute() {}
}

const contextFor = (handler: () => void) =>
  ({
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ headers: {}, query: {}, path: '/' }) }),
  }) as unknown as ExecutionContext;

describe(AuthGuard.name, () => {
  let sut: AuthGuard;
  let authService: AuthService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut: authService, mocks } = newTestService(AuthService));
    sut = new AuthGuard(mocks.logger as unknown as LoggingRepository, new Reflector(), authService);
  });

  describe('setup routes', () => {
    it('should allow access while the server is awaiting its first admin', async () => {
      mocks.user.hasAdmin.mockResolvedValue(false);
      const authenticate = vitest.spyOn(authService, 'authenticate');

      await expect(sut.canActivate(contextFor(TestController.prototype.setupRoute))).resolves.toBe(true);

      expect(authenticate).not.toHaveBeenCalled();
    });

    it('should reject when setup is disabled', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ setup: { allow: false } }));
      mocks.user.hasAdmin.mockResolvedValue(false);

      await expect(sut.canActivate(contextFor(TestController.prototype.setupRoute))).rejects.toThrowError(
        'Admin setup is not available',
      );
    });

    it('should reject when the server already has an admin', async () => {
      mocks.user.hasAdmin.mockResolvedValue(true);

      await expect(sut.canActivate(contextFor(TestController.prototype.setupRoute))).rejects.toThrowError(
        'Admin setup is not available',
      );
    });
  });

  describe('public routes', () => {
    it('should not require setup availability', async () => {
      mocks.user.hasAdmin.mockResolvedValue(true);

      await expect(sut.canActivate(contextFor(TestController.prototype.publicRoute))).resolves.toBe(true);
    });
  });

  describe('undecorated routes', () => {
    it('should be rejected', async () => {
      const authenticate = vitest.spyOn(authService, 'authenticate');

      await expect(sut.canActivate(contextFor(TestController.prototype.undecoratedRoute))).rejects.toThrowError(
        'does not declare @Authenticated()',
      );

      expect(authenticate).not.toHaveBeenCalled();
    });
  });
});
