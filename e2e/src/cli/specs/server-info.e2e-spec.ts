import { apiUtils, cliUtils, dbUtils, immichCli } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe(`immich server-info`, () => {
  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();
    await cliUtils.login();
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
