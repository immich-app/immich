import { EnvSchema } from 'src/dtos/env.dto';

describe('EnvSchema', () => {
  describe('DB_REPLICAS', () => {
    it('defaults to an empty array when no replica keys are present', () => {
      const result = EnvSchema.parse({});
      expect(result.DB_REPLICAS).toEqual([]);
    });

    it('parses a single URL-based replica', () => {
      const result = EnvSchema.parse({
        DB_REPLICA_0_URL: 'postgres://user:pass@host:5432/db',
      });

      expect(result.DB_REPLICAS).toMatchObject([{ url: 'postgres://user:pass@host:5432/db' }]);
    });

    it('parses a single parts-based replica', () => {
      const result = EnvSchema.parse({
        DB_REPLICA_0_HOSTNAME: 'replica-host',
        DB_REPLICA_0_USERNAME: 'immich',
        DB_REPLICA_0_PORT: 5432,
        DB_REPLICA_0_PASSWORD: 'secret',
        DB_REPLICA_0_DATABASE_NAME: 'immich_db',
      });

      expect(result.DB_REPLICAS).toMatchObject([
        {
          host: 'replica-host',
          port: 5432,
          username: 'immich',
          password: 'secret',
          databaseName: 'immich_db',
          sslMode: undefined,
        },
      ]);
    });

    it('parses parts-based replica with an explicit port and sslMode', () => {
      const result = EnvSchema.parse({
        DB_REPLICA_0_HOSTNAME: 'replica-host',
        DB_REPLICA_0_PORT: '5433',
        DB_REPLICA_0_USERNAME: 'immich',
        DB_REPLICA_0_PASSWORD: 'secret',
        DB_REPLICA_0_DATABASE_NAME: 'immich_db',
        DB_REPLICA_0_SSL_MODE: 'require',
      });

      expect(result.DB_REPLICAS[0]).toMatchObject({ port: 5433, sslMode: 'require' });
    });

    it('parses multiple replicas ordered by index, regardless of key order in env', () => {
      const result = EnvSchema.parse({
        DB_REPLICA_2_URL: 'postgres://replica-2',
        DB_REPLICA_0_URL: 'postgres://replica-0',
        DB_REPLICA_1_URL: 'postgres://replica-1',
      });

      expect(result.DB_REPLICAS).toMatchObject([
        { url: 'postgres://replica-0' },
        { url: 'postgres://replica-1' },
        { url: 'postgres://replica-2' },
      ]);
    });

    it('prefers URL over parts fields when both are set for the same index', () => {
      const result = EnvSchema.parse({
        DB_REPLICA_0_URL: 'postgres://replica-0',
        DB_REPLICA_0_HOSTNAME: 'ignored-host',
      });

      expect(result.DB_REPLICAS).toMatchObject([{ url: 'postgres://replica-0' }]);
    });

    it('ignores unrelated env keys', () => {
      const result = EnvSchema.parse({
        DB_HOSTNAME: 'primary-host',
        SOME_UNRELATED_VAR: 'foo',
      });

      expect(result.DB_REPLICAS).toEqual([]);
    });

    it('passes validation with only hostname provided', () => {
      const result = EnvSchema.safeParse({
        DB_REPLICA_0_HOSTNAME: 'replica-host',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('DB_REPLICATION_ENABLED', () => {
    it('fails when replication is enabled but no replicas are configured', () => {
      const result = EnvSchema.safeParse({
        DB_REPLICATION_ENABLED: 'true',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]).toMatchObject({
        path: ['DB_REPLICAS'],
        message: 'At least one DB_REPLICA_<n>_* must be configured when DB_REPLICATION_ENABLED=true',
      });
    });

    it('succeeds when replication is enabled and at least one replica is configured', () => {
      const result = EnvSchema.safeParse({
        DB_REPLICATION_ENABLED: 'true',
        DB_REPLICA_0_URL: 'postgres://replica-0',
      });

      expect(result.success).toBe(true);
    });

    it('fails if the union type is invalid', () => {
      const result = EnvSchema.safeParse({
        DB_REPLICA_0_USERNAME: 'username',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]).toMatchObject({
        message: 'Invalid DB replica configuration',
      });
    });

    it('succeeds when replication is disabled and no replicas are configured', () => {
      const result = EnvSchema.safeParse({
        DB_REPLICATION_ENABLED: 'false',
      });

      expect(result.success).toBe(true);
    });
  });
});
