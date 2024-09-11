import { immichCli, utils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe(`immich server-info`, () => {
  beforeAll(async () => {
    await utils.resetDatabase();
    const admin = await utils.adminSetup();
    await utils.cliLogin(admin.accessToken);
  });

  it('should return the server info', async () => {
    const { stderr, stdout, exitCode } = await immichCli(['server-info']);
    expect(stdout.split('\n')).toEqual([
      expect.stringContaining('Server Info (via admin@immich.cloud'),
      '  Url: http://127.0.0.1:2285/api',
      expect.stringContaining('Version:'),
      '  Formats:',
      expect.stringContaining('Images:'),
      expect.stringContaining('Videos:'),
      '  Statistics:',
      '    Images: 0',
      '    Videos: 0',
      '    Total: 0',
    ]);
    expect(stderr).toBe('');
    expect(exitCode).toBe(0);
  });
});
