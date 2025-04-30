import { ImmichTelemetry } from 'src/enum';
import { clearEnvCache, ConfigRepository } from 'src/repositories/config.repository';

const getEnv = () => {
  clearEnvCache();
  return new ConfigRepository().getEnv();
};

const resetEnv = () => {
  for (const env of [
    'IMMICH_ENV',
    'IMMICH_WORKERS_INCLUDE',
    'IMMICH_WORKERS_EXCLUDE',
    'IMMICH_TRUSTED_PROXIES',
    'IMMICH_API_METRICS_PORT',
    'IMMICH_MICROSERVICES_METRICS_PORT',
    'IMMICH_TELEMETRY_INCLUDE',
    'IMMICH_TELEMETRY_EXCLUDE',

    'DB_URL',
    'DB_HOSTNAME',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_DATABASE_NAME',
    'DB_SKIP_MIGRATIONS',
    'DB_VECTOR_EXTENSION',

    'NO_COLOR',
  ]) {
    delete process.env[env];
  }
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
        vectorExtension: 'vectors',
      });
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
      expect(() => getEnv()).toThrowError('Invalid environment variables: IMMICH_TRUSTED_PROXIES');
    });
  });

  describe('telemetry', () => {
    it('should have default values', () => {
      const { telemetry } = getEnv();
      expect(telemetry).toEqual({
        apiPort: 8081,
        microservicesPort: 8082,
        metrics: new Set([]),
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
        new Set([ImmichTelemetry.API, ImmichTelemetry.HOST, ImmichTelemetry.IO, ImmichTelemetry.REPO]),
      );
    });

    it('should run with specific telemetry metrics', () => {
      process.env.IMMICH_TELEMETRY_INCLUDE = 'io, host, api';
      const { telemetry } = getEnv();
      expect(telemetry.metrics).toEqual(new Set([ImmichTelemetry.API, ImmichTelemetry.HOST, ImmichTelemetry.IO]));
    });
  });
});
