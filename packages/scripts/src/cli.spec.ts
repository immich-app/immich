import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cli } from './cli';

const run = (args: string[]) => cli(['node', 'pnpm cli', ...args]);

describe('cli', () => {
  let exitMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitMock = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  describe('release', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each([
      [[], '--type is required'],
      [['--type'], '--type requires a value'],
      [['--type', 'invalid'], 'invalid is not an allowed choice'],
      [['--type', 'major'], 'major is invalid'],
    ])('should not accept %j because %s', (args, _description) => {
      expect(() => run(['release', ...args])).toThrow();
      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });
});
