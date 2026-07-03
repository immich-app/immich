import { ImmichTelemetry } from 'src/enum';
import { clearEnvCache, ConfigRepository } from 'src/repositories/config.repository';

const getEnv = () => {
  clearEnvCache();
  return new ConfigRepository().getEnv();
};

const resetEnv = () => {
  for (const env of [
    'IMMICH_ALLOW_EXTERNAL_PLUGINS',
    'IMMICH_ALLOW_SETUP',
    'IMMICH_ENV',
    'IMMICH_WORKERS_INCLUDE',
    'IMMICH_WORKERS_EXCLUDE',
    'IMMICH_TRUSTED_PROXIES',
    'IMMICH_API_METRICS_PORT',
    'IMMICH_MEDIA_LOCATION',
    'IMMICH_MICROSERVICES_METRICS_PORT',
    'IMMICH_TELEMETRY_INCLUDE',
    'IMMICH_TELEMETRY_EXCLUDE',

    'DB_URL',
    'DB_HOSTNAME',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_DATABASE_NAME',
    'DB_SSL_MODE',
    'DB_SKIP_MIGRATIONS',
    'DB_VECTOR_EXTENSION',

    'REDIS_HOSTNAME',
    'REDIS_PORT',
    'REDIS_DBINDEX',
    'REDIS_USERNAME',
    'REDIS_PASSWORD',
    'REDIS_SOCKET',
    'REDIS_URL',

    'NO_COLOR',

    'DB_REPLICATION_ENABLED',
    'DB_REPLICA_0_HOSTNAME',
    'DB_REPLICA_0_PORT',
    'DB_REPLICA_0_USERNAME',
    'DB_REPLICA_0_PASSWORD',
    'DB_REPLICA_0_DATABASE_NAME',
    'DB_REPLICA_0_SSL_MODE',
    'DB_REPLICA_0_URL',
    'DB_REPLICA_1_HOSTNAME',
    'DB_REPLICA_1_PORT',
    'DB_REPLICA_1_USERNAME',
    'DB_REPLICA_1_PASSWORD',
    'DB_REPLICA_1_DATABASE_NAME',
    'DB_REPLICA_1_SSL_MODE',
    'DB_REPLICA_1_URL',
  ]) {
    delete process.env[env];
  }
};

const sentinelConfig = {
  sentinels: [
    {
      host: 'redis-sentinel-node-0',
      port: 26_379,
    },
    {
      host: 'redis-sentinel-node-1',
      port: 26_379,
    },
    {
      host: 'redis-sentinel-node-2',
      port: 26_379,
    },
  ],
  name: 'redis-sentinel',
};

describe('getEnv', () => {
  beforeEach(() => {
    resetEnv();
  });

  it('should use defaults', () => {
    const config = getEnv();

    expect(config).toMatchObject({
      host: undefined,
      port: 2283,
      environment: 'production',
      configFile: undefined,
      logLevel: undefined,
    });

    expect(config.plugins.external).toEqual({ allow: false });
    expect(config.setup).toEqual({ allow: true });
  });

  describe('IMMICH_MEDIA_LOCATION', () => {
    it('should throw an error for relative paths', () => {
      process.env.IMMICH_MEDIA_LOCATION = './relative/path';
      expect(() => getEnv()).toThrowError('[IMMICH_MEDIA_LOCATION] Must be an absolute path');
    });
  });

  describe('IMMICH_ALLOW_EXTERNAL_PLUGINS', () => {
    it('should disable plugins', () => {
      process.env.IMMICH_ALLOW_EXTERNAL_PLUGINS = 'false';
      const config = getEnv();
      expect(config.plugins.external).toEqual({ allow: false });
    });

    it('should throw an error for invalid value', () => {
      process.env.IMMICH_ALLOW_EXTERNAL_PLUGINS = 'invalid';
      expect(() => getEnv()).toThrowError('[IMMICH_ALLOW_EXTERNAL_PLUGINS] Invalid option: expected one of');
    });
  });

  describe('IMMICH_ALLOW_SETUP', () => {
    it('should disable setup', () => {
      process.env.IMMICH_ALLOW_SETUP = 'false';
      const { setup } = getEnv();
      expect(setup).toEqual({ allow: false });
    });

    it('should throw an error for invalid value', () => {
      process.env.IMMICH_ALLOW_SETUP = 'invalid';
      expect(() => getEnv()).toThrowError('[IMMICH_ALLOW_SETUP] Invalid option: expected one of');
    });
  });

  describe('database', () => {
    it('should use defaults', () => {
      const { database } = getEnv();
      expect(database).toEqual({
        config: {
          connectionType: 'parts',
          host: 'database',
          port: 5432,
          database: 'immich',
          username: 'postgres',
          password: 'postgres',
          ssl: undefined,
        },
        skipMigrations: false,
        vectorExtension: undefined,
        enableReplicas: false,
        replicas: undefined,
      });
    });

    it('should validate DB_SSL_MODE', () => {
      process.env.DB_SSL_MODE = 'invalid';
      expect(() => getEnv()).toThrow(/\[DB_SSL_MODE\] Invalid option: expected one of/);
    });

    it('should accept a valid DB_SSL_MODE', () => {
      process.env.DB_SSL_MODE = 'prefer';
      const { database } = getEnv();
      expect(database.config).toMatchObject(expect.objectContaining({ ssl: 'prefer' }));
    });

    it('should allow skipping migrations', () => {
      process.env.DB_SKIP_MIGRATIONS = 'true';
      const { database } = getEnv();
      expect(database).toMatchObject({ skipMigrations: true });
    });

    it('should use DB_URL', () => {
      process.env.DB_URL = 'postgres://postgres1:postgres2@database1:54320/immich';
      const { database } = getEnv();
      expect(database.config).toMatchObject({
        connectionType: 'url',
        url: 'postgres://postgres1:postgres2@database1:54320/immich',
      });
    });
  });

  describe('redis', () => {
    it('should use defaults', () => {
      const { redis } = getEnv();
      expect(redis).toEqual({
        host: 'redis',
        port: 6379,
        db: 0,
        username: undefined,
        password: undefined,
        path: undefined,
      });
    });

    it('should parse base64 encoded config, ignore other env', () => {
      process.env.REDIS_URL = `ioredis://${Buffer.from(JSON.stringify(sentinelConfig)).toString('base64')}`;
      process.env.REDIS_HOSTNAME = 'redis-host';
      process.env.REDIS_USERNAME = 'redis-user';
      process.env.REDIS_PASSWORD = 'redis-password';
      const { redis } = getEnv();
      expect(redis).toEqual(sentinelConfig);
    });

    it('should reject invalid json', () => {
      process.env.REDIS_URL = `ioredis://${Buffer.from('{ "invalid json"').toString('base64')}`;
      expect(() => getEnv()).toThrowError('Failed to decode redis options');
    });
  });

  describe('noColor', () => {
    beforeEach(() => {
      delete process.env.NO_COLOR;
    });

    it('should default noColor to false', () => {
      const { noColor } = getEnv();
      expect(noColor).toBe(false);
    });

    it('should map NO_COLOR=1 to true', () => {
      process.env.NO_COLOR = '1';
      const { noColor } = getEnv();
      expect(noColor).toBe(true);
    });

    it('should map NO_COLOR=true to true', () => {
      process.env.NO_COLOR = 'true';
      const { noColor } = getEnv();
      expect(noColor).toBe(true);
    });
  });

  describe('workers', () => {
    it('should return default workers', () => {
      const { workers } = getEnv();
      expect(workers).toEqual(['api', 'microservices']);
    });

    it('should return included workers', () => {
      process.env.IMMICH_WORKERS_INCLUDE = 'api';
      const { workers } = getEnv();
      expect(workers).toEqual(['api']);
    });

    it('should excluded workers from defaults', () => {
      process.env.IMMICH_WORKERS_EXCLUDE = 'api';
      const { workers } = getEnv();
      expect(workers).toEqual(['microservices']);
    });

    it('should exclude workers from include list', () => {
      process.env.IMMICH_WORKERS_INCLUDE = 'api,microservices,randomservice';
      process.env.IMMICH_WORKERS_EXCLUDE = 'randomservice,microservices';
      const { workers } = getEnv();
      expect(workers).toEqual(['api']);
    });

    it('should remove whitespace from included workers before parsing', () => {
      process.env.IMMICH_WORKERS_INCLUDE = 'api, microservices';
      const { workers } = getEnv();
      expect(workers).toEqual(['api', 'microservices']);
    });

    it('should remove whitespace from excluded workers before parsing', () => {
      process.env.IMMICH_WORKERS_EXCLUDE = 'api, microservices';
      const { workers } = getEnv();
      expect(workers).toEqual([]);
    });

    it('should remove whitespace from included and excluded workers before parsing', () => {
      process.env.IMMICH_WORKERS_INCLUDE = 'api, microservices, randomservice,randomservice2';
      process.env.IMMICH_WORKERS_EXCLUDE = 'randomservice,microservices, randomservice2';
      const { workers } = getEnv();
      expect(workers).toEqual(['api']);
    });

    it('should throw error for invalid workers', () => {
      process.env.IMMICH_WORKERS_INCLUDE = 'api,microservices,randomservice';
      expect(getEnv).toThrowError('Invalid worker(s) found: api,microservices,randomservice');
    });
  });

  describe('network', () => {
    it('should return default network options', () => {
      const { network } = getEnv();
      expect(network).toEqual({
        trustedProxies: ['linklocal', 'uniquelocal'],
      });
    });

    it('should parse trusted proxies', () => {
      process.env.IMMICH_TRUSTED_PROXIES = '10.1.0.0,10.2.0.0, 169.254.0.0/16';
      const { network } = getEnv();
      expect(network).toEqual({
        trustedProxies: ['10.1.0.0', '10.2.0.0', '169.254.0.0/16'],
      });
    });

    it('should reject invalid trusted proxies', () => {
      process.env.IMMICH_TRUSTED_PROXIES = '10.1';
      expect(() => getEnv()).toThrow('[IMMICH_TRUSTED_PROXIES] Must be an ip address or ip address range');
    });
  });

  describe('telemetry', () => {
    it('should have default values', () => {
      const { telemetry } = getEnv();
      expect(telemetry).toEqual({
        apiPort: 8081,
        microservicesPort: 8082,
        metrics: new Set(),
      });
    });

    it('should parse custom ports', () => {
      process.env.IMMICH_API_METRICS_PORT = '2001';
      process.env.IMMICH_MICROSERVICES_METRICS_PORT = '2002';
      const { telemetry } = getEnv();
      expect(telemetry).toMatchObject({
        apiPort: 2001,
        microservicesPort: 2002,
        metrics: expect.any(Set),
      });
    });

    it('should run with telemetry enabled', () => {
      process.env.IMMICH_TELEMETRY_INCLUDE = 'all';
      const { telemetry } = getEnv();
      expect(telemetry.metrics).toEqual(new Set(Object.values(ImmichTelemetry)));
    });

    it('should run with telemetry enabled and jobs disabled', () => {
      process.env.IMMICH_TELEMETRY_INCLUDE = 'all';
      process.env.IMMICH_TELEMETRY_EXCLUDE = 'job';
      const { telemetry } = getEnv();
      expect(telemetry.metrics).toEqual(
        new Set([ImmichTelemetry.Api, ImmichTelemetry.Host, ImmichTelemetry.Io, ImmichTelemetry.Repo]),
      );
    });

    it('should run with specific telemetry metrics', () => {
      process.env.IMMICH_TELEMETRY_INCLUDE = 'io, host, api';
      const { telemetry } = getEnv();
      expect(telemetry.metrics).toEqual(new Set([ImmichTelemetry.Api, ImmichTelemetry.Host, ImmichTelemetry.Io]));
    });
  });

  describe('replicas', () => {
    it('should default to no replicas', () => {
      const { database } = getEnv();
      expect(database.enableReplicas).toBe(false);
      expect(database.replicas).toBeUndefined();
    });

    it('should parse a parts-based replica with defaults applied', () => {
      process.env.DB_REPLICA_0_HOSTNAME = 'replica-host';
      const { database } = getEnv();
      expect(database.replicas).toEqual([
        {
          connectionType: 'parts',
          host: 'replica-host',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'immich',
          ssl: undefined,
        },
      ]);
    });

    it('should parse a parts-based replica with explicit values', () => {
      process.env.DB_REPLICA_0_HOSTNAME = 'replica-host';
      process.env.DB_REPLICA_0_PORT = '5433';
      process.env.DB_REPLICA_0_USERNAME = 'replica-user';
      process.env.DB_REPLICA_0_PASSWORD = 'replica-pass';
      process.env.DB_REPLICA_0_DATABASE_NAME = 'immich_replica';
      process.env.DB_REPLICA_0_SSL_MODE = 'require';
      const { database } = getEnv();
      expect(database.replicas).toEqual([
        {
          connectionType: 'parts',
          host: 'replica-host',
          port: 5433,
          username: 'replica-user',
          password: 'replica-pass',
          database: 'immich_replica',
          ssl: 'require',
        },
      ]);
    });

    it('should parse a url-based replica', () => {
      process.env.DB_REPLICA_0_URL = 'postgres://replica-user:replica-pass@replica-host:5432/immich_replica';
      const { database } = getEnv();
      expect(database.replicas).toEqual([
        {
          connectionType: 'url',
          url: 'postgres://replica-user:replica-pass@replica-host:5432/immich_replica',
        },
      ]);
    });

    it('should prefer DB_REPLICA_<n>_URL over other fields for the same index', () => {
      process.env.DB_REPLICA_0_URL = 'postgres://replica-user:replica-pass@replica-host:5432/immich_replica';
      process.env.DB_REPLICA_0_HOSTNAME = 'ignored-host';
      const { database } = getEnv();
      expect(database.replicas).toEqual([
        {
          connectionType: 'url',
          url: 'postgres://replica-user:replica-pass@replica-host:5432/immich_replica',
        },
      ]);
    });

    it('should parse multiple replicas in index order', () => {
      process.env.DB_REPLICA_1_HOSTNAME = 'replica-host-1';
      process.env.DB_REPLICA_0_HOSTNAME = 'replica-host-0';
      const { database } = getEnv();
      expect(database.replicas).toEqual([
        {
          connectionType: 'parts',
          host: 'replica-host-0',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'immich',
          ssl: undefined,
        },
        {
          connectionType: 'parts',
          host: 'replica-host-1',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'immich',
          ssl: undefined,
        },
      ]);
    });

    it('should enable replicas when DB_REPLICATION_ENABLED is true and at least one replica is configured', () => {
      process.env.DB_REPLICATION_ENABLED = 'true';
      process.env.DB_REPLICA_0_HOSTNAME = 'replica-host';
      const { database } = getEnv();
      expect(database.enableReplicas).toBe(true);
      expect(database.replicas).toHaveLength(1);
    });

    it('should throw an error when DB_REPLICATION_ENABLED is true and no replicas are configured', () => {
      process.env.DB_REPLICATION_ENABLED = 'true';
      expect(() => getEnv()).toThrowError(
        '[DB_REPLICAS] At least one DB_REPLICA_<n>_* must be configured when DB_REPLICATION_ENABLED=true',
      );
    });

    it('should throw an error for an invalid replica configuration', () => {
      // a parts-style replica requires at least a hostname
      process.env.DB_REPLICA_0_PORT = '5433';
      expect(() => getEnv()).toThrowError('[DB_REPLICAS] Invalid DB replica configuration');
    });
  });
});
