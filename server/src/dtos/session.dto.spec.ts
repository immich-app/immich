import { Session } from 'src/database.js';
import { mapSession } from 'src/dtos/session.dto.js';

const session = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-id',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  expiresAt: null,
  deviceOS: 'Android',
  deviceType: 'mobile',
  appVersion: '1.0.0',
  pinExpiresAt: null,
  isPendingSyncReset: false,
  ...overrides,
});

describe(mapSession.name, () => {
  it('should pass through a real deviceType value unchanged', () => {
    const result = mapSession(session());
    expect(result.deviceType).toEqual('mobile');
  });

  it('should coerce a null deviceType to an empty string for backwards compatibility', () => {
    const result = mapSession(session({ deviceType: null }));
    expect(result.deviceType).toEqual('');
  });
});
