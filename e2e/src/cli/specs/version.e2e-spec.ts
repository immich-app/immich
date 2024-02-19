import { readFileSync } from 'node:fs';
import { apiUtils, immichCli } from 'src/utils';
import { beforeAll, describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync('../cli/package.json', 'utf8'));

describe(`immich --version`, () => {
  beforeAll(() => {
    apiUtils.setup();
  });

  describe('immich --version', () => {
    it('should print the cli version', async () => {
      const { stdout, stderr, exitCode } = await immichCli(['--version']);
      expect(stdout).toEqual(pkg.version);
      expect(stderr).toEqual('');
      expect(exitCode).toBe(0);
    });
  });

  describe('immich -V', () => {
    it('should print the cli version', async () => {
      const { stdout, stderr, exitCode } = await immichCli(['-V']);
      expect(stdout).toEqual(pkg.version);
      expect(stderr).toEqual('');
      expect(exitCode).toBe(0);
    });
  });
});
