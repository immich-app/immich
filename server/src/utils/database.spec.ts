import { asPostgresConnectionConfig } from 'src/utils/database';

describe('database  utils', () => {
  describe('asPostgresConnectionConfig', () => {
    it('should handle sslmode=require', () => {
      expect(
        asPostgresConnectionConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?sslmode=require',
        }),
      ).toMatchObject({ ssl: {} });
    });

    it('should handle sslmode=prefer', () => {
      expect(
        asPostgresConnectionConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?sslmode=prefer',
        }),
      ).toMatchObject({ ssl: {} });
    });

    it('should handle sslmode=verify-ca', () => {
      expect(
        asPostgresConnectionConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?sslmode=verify-ca',
        }),
      ).toMatchObject({ ssl: {} });
    });

    it('should handle sslmode=verify-full', () => {
      expect(
        asPostgresConnectionConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?sslmode=verify-full',
        }),
      ).toMatchObject({ ssl: {} });
    });

    it('should handle sslmode=no-verify', () => {
      expect(
        asPostgresConnectionConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?sslmode=no-verify',
        }),
      ).toMatchObject({ ssl: { rejectUnauthorized: false } });
    });

    it('should handle ssl=true', () => {
      expect(
        asPostgresConnectionConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?ssl=true',
        }),
      ).toMatchObject({ ssl: true });
    });

    it('should reject invalid ssl', () => {
      expect(() =>
        asPostgresConnectionConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?ssl=invalid',
        }),
      ).toThrowError('Invalid ssl option');
    });

    it('should handle socket: URLs', () => {
      expect(
        asPostgresConnectionConfig({ connectionType: 'url', url: 'socket:/run/postgresql?db=database1' }),
      ).toMatchObject({ host: '/run/postgresql', database: 'database1' });
    });

    it('should handle sockets in postgres: URLs', () => {
      expect(
        asPostgresConnectionConfig({ connectionType: 'url', url: 'postgres:///database2?host=/path/to/socket' }),
      ).toMatchObject({
        host: '/path/to/socket',
        database: 'database2',
      });
    });
  });
});
