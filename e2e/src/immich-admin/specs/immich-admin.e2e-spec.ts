import { immichAdmin, utils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe(`immich-admin`, () => {
  beforeAll(async () => {
    await utils.resetDatabase();
    await utils.adminSetup();
  });

  describe('list-users', () => {
    it('should list the admin user', async () => {
      const { stdout, stderr, exitCode } = await immichAdmin(['list-users']).promise;
      expect(exitCode).toBe(0);
      expect(stderr).toBe('');
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

      const { stderr, stdout, exitCode } = await promise;
      expect(exitCode).toBe(0);
      expect(stderr).toBe('');
      expect(stdout).toContain('The admin password has been updated to:');
    });
  });
});
