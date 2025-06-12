import { immichAdmin, utils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe(`immich-admin`, () => {
  beforeAll(async () => {
    await utils.resetDatabase();
    await utils.adminSetup();
  });

  describe('revoke-admin', () => {
    it('should revoke admin privileges from a user', async () => {
      const { child, promise } = immichAdmin(['revoke-admin']);

      let data = '';
      child.stdout.on('data', (chunk) => {
        data += chunk;
        if (data.includes('Please enter the user email:')) {
          child.stdin.end('admin@immich.cloud\n');
        }
      });

      const { stdout, exitCode } = await promise;
      expect(exitCode).toBe(0);

      expect(stdout).toContain('Admin access has been revoked from');
    });
  });

  describe('grant-admin', () => {
    it('should grant admin privileges to a user', async () => {
      const { child, promise } = immichAdmin(['grant-admin']);

      let data = '';
      child.stdout.on('data', (chunk) => {
        data += chunk;
        if (data.includes('Please enter the user email:')) {
          child.stdin.end('admin@immich.cloud\n');
        }
      });

      const { stdout, exitCode } = await promise;
      expect(exitCode).toBe(0);

      expect(stdout).toContain('Admin access has been granted to');
    });
  });

  describe('list-users', () => {
    it('should list the admin user', async () => {
      const { stdout, exitCode } = await immichAdmin(['list-users']).promise;
      expect(exitCode).toBe(0);

      // TODO: Vitest needs upgrade to Node 22.x to fix the failed check
      // expect(stderr).toBe('');
      expect(stdout).toContain("email: 'admin@immich.cloud'");
      expect(stdout).toContain("name: 'Immich Admin'");
    });
  });

  describe('reset-admin-password', () => {
    it('should reset admin password', async () => {
      const { child, promise } = immichAdmin(['reset-admin-password']);

      let data = '';
      child.stdout.on('data', (chunk) => {
        data += chunk;
        if (data.includes('Please choose a new password (optional)')) {
          child.stdin.end('\n');
        }
      });

      const { stdout, exitCode } = await promise;
      expect(exitCode).toBe(0);
      // TODO: Vitest needs upgrade to Node 22.x to fix the failed check
      // expect(stderr).toBe('');
      expect(stdout).toContain('The admin password has been updated to:');
    });
  });
});
