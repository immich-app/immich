import { immichCli, utils } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe(`immich server-info`, () => {
  beforeAll(async () => {
    await utils.resetDatabase();
    await utils.cliLogin();
  });

  it('should return the server info', async () => {
    const { stderr, stdout, exitCode } = await immichCli(['server-info']);
    expect(stdout.split('\n')).toEqual([
      expect.stringContaining('Server Version:'),
      expect.stringContaining('Image Types:'),
      expect.stringContaining('Video Types:'),
      'Statistics:',
      '  Images: 0',
      '  Videos: 0',
      '  Total: 0',
    ]);
    expect(stderr).toBe('');
    expect(exitCode).toBe(0);
  });
});
