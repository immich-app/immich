import { ImmichTelemetry } from 'src/enum.js';
import { ConfigRepository, clearEnvCache } from 'src/repositories/config.repository.js';
import { applyCspHashes } from 'src/utils/helmet.js';

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
    'IMMICH_CONFIG_FILE',
    'IMMICH_CONFIG_FFMPEG_CRF',
    'IMMICH_CONFIG_LOGGING_ENABLED',
    'IMMICH_CONFIG_LOGGING_LEVEL',
    'IMMICH_LOG_LEVEL',
    'IMMICH_MACHINE_LEARNING_ENABLED',
    'IMMICH_MACHINE_LEARNING_URL',

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

  describe('configOverrides', () => {
    it('collects IMMICH_CONFIG_ variables', () => {
      process.env.IMMICH_CONFIG_FFMPEG_CRF = '30';

      const { configOverrides } = getEnv();

      expect(configOverrides).toEqual({ IMMICH_CONFIG_FFMPEG_CRF: '30' });
    });

    it('drops an empty value', () => {
      process.env.IMMICH_CONFIG_FFMPEG_CRF = '';

      const { configOverrides } = getEnv();

      expect(configOverrides).toEqual({});
    });

    it('does not treat IMMICH_CONFIG_FILE as an override', () => {
      process.env.IMMICH_CONFIG_FILE = 'immich-config.json';

      const { configOverrides } = getEnv();

      expect(configOverrides).toEqual({});
    });

    it.each([
      {
        name: 'IMMICH_MACHINE_LEARNING_ENABLED',
        replacement: 'IMMICH_CONFIG_MACHINE_LEARNING_ENABLED',
        value: 'false',
      },
      {
        name: 'IMMICH_MACHINE_LEARNING_URL',
        replacement: 'IMMICH_CONFIG_MACHINE_LEARNING_URLS',
        value: 'http://ml:3003',
      },
    ])('maps $name to $replacement', ({ name, replacement, value }) => {
      process.env[name] = value;

      const { configOverrides, deprecatedConfigVariables } = getEnv();

      expect(configOverrides).toEqual({ [replacement]: value });
      expect(deprecatedConfigVariables).toEqual([{ name, replacement }]);
    });

    it('maps IMMICH_LOG_LEVEL to IMMICH_CONFIG_LOGGING_LEVEL and enables logging', () => {
      process.env.IMMICH_LOG_LEVEL = 'debug';

      const { configOverrides, deprecatedConfigVariables, logLevel } = getEnv();

      expect(configOverrides).toEqual({ IMMICH_CONFIG_LOGGING_LEVEL: 'debug', IMMICH_CONFIG_LOGGING_ENABLED: 'true' });
      expect(deprecatedConfigVariables).toEqual([
        { name: 'IMMICH_LOG_LEVEL', replacement: 'IMMICH_CONFIG_LOGGING_LEVEL' },
      ]);
      expect(logLevel).toBe('debug');
    });

    it('prefers the new name over a deprecated alias', () => {
      process.env.IMMICH_LOG_LEVEL = 'debug';
      process.env.IMMICH_CONFIG_LOGGING_LEVEL = 'verbose';
      process.env.IMMICH_CONFIG_LOGGING_ENABLED = 'false';

      const { configOverrides, logLevel } = getEnv();

      expect(configOverrides).toEqual({
        IMMICH_CONFIG_LOGGING_LEVEL: 'verbose',
        IMMICH_CONFIG_LOGGING_ENABLED: 'false',
      });
      expect(logLevel).toBe('verbose');
    });

    it('does not report unused deprecated variables', () => {
      const { deprecatedConfigVariables } = getEnv();

      expect(deprecatedConfigVariables).toEqual([]);
    });
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
        },
        skipMigrations: false,
        vectorExtension: undefined,
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
});

describe('applyCspHashes', () => {
  const manifest = { 'script-src': [`'sha256-script'`], 'style-src': [`'sha256-style'`] };

  it('should append the hashes of the inline content', () => {
    const directives = applyCspHashes({ 'script-src': [`'self'`], 'style-src': [`'self'`] }, manifest);

    expect(directives).toEqual({
      'script-src': [`'self'`, `'sha256-script'`],
      'style-src': [`'self'`, `'sha256-style'`],
    });
  });

  it('should skip a directive that allows unsafe-inline, which a hash would disable', () => {
    const directives = applyCspHashes({ 'script-src': [`'self'`, `'unsafe-inline'`] }, manifest);

    expect(directives['script-src']).toEqual([`'self'`, `'unsafe-inline'`]);
  });

  it('should skip a directive the policy does not declare', () => {
    const directives = applyCspHashes({ 'script-src': [`'self'`] }, manifest);

    expect(directives).not.toHaveProperty('style-src');
  });

  it('should not mutate the directives it is given', () => {
    const directives = { 'script-src': [`'self'`] };
    applyCspHashes(directives, manifest);

    expect(directives).toEqual({ 'script-src': [`'self'`] });
  });
});
