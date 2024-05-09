import { immichAdmin, utils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe(`immich-admin`, () => {
  beforeAll(async () => {
    await utils.resetDatabase();
    await utils.adminSetup();
  });

  describe('list-users', () => {
    it('should list the admin user', async () => {
      const { stdout, stderr, exitCode } = await immichAdmin(['list-users']);
      expect(exitCode).toBe(0);
      expect(stderr).toBe('');
      expect(stdout).toContain("email: 'admin@immich.cloud'");
      expect(stdout).toContain("name: 'Immich Admin'");
    });
  });
});
