import { Session } from 'src/database.js';
import { mapSession } from 'src/dtos/session.dto.js';

const session = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-id',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  expiresAt: null,
  deviceOS: 'Windows',
  deviceType: 'Chrome',
  appVersion: '1.0.0',
  pinExpiresAt: null,
  isPendingSyncReset: false,
  ...overrides,
});

describe(mapSession.name, () => {
  it('should pass through real deviceOS and deviceType values unchanged', () => {
    const result = mapSession(session());
    expect(result.deviceOS).toEqual('Windows');
    expect(result.deviceType).toEqual('Chrome');
  });

  it('should coerce null deviceOS to an empty string on the response for backwards compatibility', () => {
    const result = mapSession(session({ deviceOS: null }));
    expect(result.deviceOS).toEqual('');
  });

  it('should coerce null deviceType to an empty string on the response for backwards compatibility', () => {
    const result = mapSession(session({ deviceType: null }));
    expect(result.deviceType).toEqual('');
  });

  it('should coerce both null values simultaneously', () => {
    const result = mapSession(session({ deviceOS: null, deviceType: null }));
    expect(result.deviceOS).toEqual('');
    expect(result.deviceType).toEqual('');
  });

  it('should preserve non-empty appVersion and set current flag correctly', () => {
    const result = mapSession(session({ id: 'active-id' }), 'active-id');
    expect(result.current).toBe(true);
    expect(result.appVersion).toEqual('1.0.0');
  });
});
