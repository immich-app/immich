import { CallHandler, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { of } from 'rxjs';
import { DemoInterceptor } from 'src/middleware/demo.interceptor';
import { ConfigRepository } from 'src/repositories/config.repository';

const createContext = (method: string, path: string, userEmail?: string) => {
  const request = {
    method,
    path,
    user: userEmail ? { user: { email: userEmail } } : undefined,
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
};

describe('DemoInterceptor', () => {
  let interceptor: DemoInterceptor;
  let configRepository: { getEnv: ReturnType<typeof vi.fn> };
  let callHandler: CallHandler;

  beforeEach(() => {
    configRepository = { getEnv: vi.fn() };
    callHandler = { handle: vi.fn().mockReturnValue(of({})) };
    interceptor = new DemoInterceptor(configRepository as unknown as ConfigRepository);
  });

  it('should allow all requests when demo mode is off', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: false, email: '', password: '' } });
    const context = createContext('DELETE', '/api/assets', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow all requests for non-demo users', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('DELETE', '/api/assets', 'admin@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow GET requests for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('GET', '/api/assets', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow POST /search/metadata for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('POST', '/api/search/metadata', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should block POST /assets for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('POST', '/api/assets', 'demo@test.com');
    expect(() => interceptor.intercept(context, callHandler)).toThrow(ForbiddenException);
  });

  it('should block DELETE requests for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('DELETE', '/api/assets', 'demo@test.com');
    expect(() => interceptor.intercept(context, callHandler)).toThrow(ForbiddenException);
  });

  it('should block PUT requests for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('PUT', '/api/assets', 'demo@test.com');
    expect(() => interceptor.intercept(context, callHandler)).toThrow(ForbiddenException);
  });

  it('should allow POST /download/info for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('POST', '/api/download/info', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow POST /auth/logout for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('POST', '/api/auth/logout', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow POST /auth/validateToken for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('POST', '/api/auth/validateToken', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow POST /auth/change-password for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('POST', '/api/auth/change-password', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow PUT /users/me/preferences for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('PUT', '/api/users/me/preferences', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow PUT /users/me/onboarding for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('PUT', '/api/users/me/onboarding', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });
});
