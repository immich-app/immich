import { clearEnvCache, ConfigRepository } from 'src/repositories/config.repository';

const setEnv = (env: Record<string, string | undefined>) => {
  const backup: Record<string, string | undefined> = {};
  for (const key of Object.keys({ ...process.env, ...env })) {
    backup[key] = process.env[key];
  }
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  clearEnvCache();
  return () => {
    for (const [key, value] of Object.entries(backup)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    clearEnvCache();
  };
};

describe(ConfigRepository.name, () => {
  describe('redis config', () => {
    it('should use host/port from env vars when REDIS_SOCKET is not set', () => {
      const restore = setEnv({
        REDIS_HOSTNAME: 'my-redis',
        REDIS_PORT: '6380',
        REDIS_DBINDEX: '2',
        REDIS_USERNAME: 'user',
        REDIS_PASSWORD: 'pass',
        REDIS_SOCKET: undefined,
        REDIS_URL: undefined,
      });

      try {
        const sut = new ConfigRepository();
        const { redis } = sut.getEnv();
        expect(redis).toEqual({
          host: 'my-redis',
          port: 6380,
          db: 2,
          username: 'user',
          password: 'pass',
        });
      } finally {
        restore();
      }
    });

    it('should ignore TCP env vars when REDIS_SOCKET is set', () => {
      const restore = setEnv({
        REDIS_HOSTNAME: 'my-redis',
        REDIS_PORT: '6380',
        REDIS_DBINDEX: '2',
        REDIS_USERNAME: 'user',
        REDIS_PASSWORD: 'pass',
        REDIS_SOCKET: '/var/run/redis/redis.sock',
        REDIS_URL: undefined,
      });

      try {
        const sut = new ConfigRepository();
        const { redis } = sut.getEnv();
        expect(redis).toEqual({ path: '/var/run/redis/redis.sock' });
      } finally {
        restore();
      }
    });

    it('should default to redis:6379 when no REDIS_* vars are set', () => {
      const restore = setEnv({
        REDIS_HOSTNAME: undefined,
        REDIS_PORT: undefined,
        REDIS_DBINDEX: undefined,
        REDIS_USERNAME: undefined,
        REDIS_PASSWORD: undefined,
        REDIS_SOCKET: undefined,
        REDIS_URL: undefined,
      });

      try {
        const sut = new ConfigRepository();
        const { redis } = sut.getEnv();
        expect(redis).toEqual({
          host: 'redis',
          port: 6379,
          db: 0,
          username: undefined,
          password: undefined,
        });
      } finally {
        restore();
      }
    });
  });
});
