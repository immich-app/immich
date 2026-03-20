import { AuthService, LoginDetails } from 'src/services/auth.service';
import { SessionFactory } from 'test/factories/session.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe('AuthService (demo)', () => {
  let sut: AuthService;
  let mocks: ServiceMocks;

  const loginDetails: LoginDetails = {
    clientIp: '127.0.0.1',
    isSecure: true,
    deviceType: 'browser',
    deviceOS: 'linux',
    appVersion: 'demo',
  };

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AuthService));
  });

  describe('demoLogin', () => {
    it('should throw if demo mode is not enabled', async () => {
      mocks.config.getEnv.mockReturnValue({ demo: { enabled: false, email: '', password: '' } } as any);
      await expect(sut.demoLogin(loginDetails)).rejects.toThrow('Demo mode is not enabled');
    });

    it('should throw if demo user is not found', async () => {
      mocks.config.getEnv.mockReturnValue({
        demo: { enabled: true, email: 'demo@test.com', password: 'demo' },
      } as any);
      mocks.user.getByEmail.mockResolvedValue(void 0);
      await expect(sut.demoLogin(loginDetails)).rejects.toThrow('Demo user not found');
    });

    it('should create a session and return login response', async () => {
      const demoUser = { id: 'demo-user-id', email: 'demo@test.com', name: 'Demo', metadata: [] };
      mocks.config.getEnv.mockReturnValue({
        demo: { enabled: true, email: 'demo@test.com', password: 'demo' },
      } as any);
      mocks.user.getByEmail.mockResolvedValue(demoUser as any);
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      const result = await sut.demoLogin(loginDetails);

      expect(mocks.user.getByEmail).toHaveBeenCalledWith('demo@test.com');
      expect(mocks.session.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'demo-user-id' }));
      expect(result).toBeDefined();
    });
  });
});
