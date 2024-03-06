import { stat } from 'node:fs/promises';
import { apiUtils, app, dbUtils, immichCli } from 'src/utils';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe(`immich login-key`, () => {
  beforeAll(() => {
    apiUtils.setup();
  });

  beforeEach(async () => {
    await dbUtils.reset();
  });

  it('should require a url', async () => {
    const { stderr, exitCode } = await immichCli(['login-key']);
    expect(stderr).toBe("error: missing required argument 'url'");
    expect(exitCode).toBe(1);
  });

  it('should require a key', async () => {
    const { stderr, exitCode } = await immichCli(['login-key', app]);
    expect(stderr).toBe("error: missing required argument 'key'");
    expect(exitCode).toBe(1);
  });

  it('should require a valid key', async () => {
    const { stderr, exitCode } = await immichCli(['login-key', app, 'immich-is-so-cool']);
    expect(stderr).toContain('Failed to connect to server http://127.0.0.1:2283/api: Error: 401');
    expect(exitCode).toBe(1);
  });

  it('should login and save auth.yml with 600', async () => {
    const admin = await apiUtils.adminSetup();
    const key = await apiUtils.createApiKey(admin.accessToken);
    const { stdout, stderr, exitCode } = await immichCli(['login-key', app, `${key.secret}`]);
    expect(stdout.split('\n')).toEqual([
      'Logging in to http://127.0.0.1:2283/api',
      'Logged in as admin@immich.cloud',
      'Wrote auth info to /tmp/immich/auth.yml',
    ]);
    expect(stderr).toBe('');
    expect(exitCode).toBe(0);

    const stats = await stat('/tmp/immich/auth.yml');
    const mode = (stats.mode & 0o777).toString(8);
    expect(mode).toEqual('600');
  });

  it('should login without /api in the url', async () => {
    const admin = await apiUtils.adminSetup();
    const key = await apiUtils.createApiKey(admin.accessToken);
    const { stdout, stderr, exitCode } = await immichCli(['login-key', app.replaceAll('/api', ''), `${key.secret}`]);
    expect(stdout.split('\n')).toEqual([
      'Logging in to http://127.0.0.1:2283',
      'Discovered API at http://127.0.0.1:2283/api',
      'Logged in as admin@immich.cloud',
      'Wrote auth info to /tmp/immich/auth.yml',
    ]);
    expect(stderr).toBe('');
    expect(exitCode).toBe(0);
  });
});
