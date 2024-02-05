import { restoreTempFolder, testApp } from '@test-utils';
import { CLI_BASE_OPTIONS, setup, spyOnConsole } from 'test/cli-test-utils';
import { ServerInfoCommand } from '../../src/commands/server-info.command';

describe(`server-info (e2e)`, () => {
  const consoleSpy = spyOnConsole();

  beforeAll(async () => {
    await testApp.create();
  });

  afterAll(async () => {
    await testApp.teardown();
    await restoreTempFolder();
  });

  beforeEach(async () => {
    await testApp.reset();
    await restoreTempFolder();
    const api = await setup();
    process.env.IMMICH_API_KEY = api.apiKey;
  });

  it('should show server version', async () => {
    await new ServerInfoCommand(CLI_BASE_OPTIONS).run();

    expect(consoleSpy.mock.calls).toEqual([
      [expect.stringMatching(new RegExp('Server Version: \\d+.\\d+.\\d+'))],
      [expect.stringMatching('Image Types: .*')],
      [expect.stringMatching('Video Types: .*')],
      ['Statistics:\n  Images: 0\n  Videos: 0\n  Total: 0'],
    ]);
  });
});
