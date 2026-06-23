import { describe, expect, it } from 'vitest';
import { pump } from './pump';

describe(pump.name, () => {
  describe('usage', () => {
    it.each([
      [],
      ['2.7.5'],
      ['2.7.5', 'invalid'],
      ['invalid', 'patch'],
      ['2.7.5', 'major'],
    ])('should not accept $0, $1 as inputs', (version, type) => {
      expect(pump(version, type)).toEqual({
        message: expect.stringContaining('Usage: '),
        exitCode: 1,
      });
    });
  });

  describe('transitions', () => {
    const valid = [
      {
        name: 'patch',
        items: [['patch', '2.7.5', '2.7.6']],
      },
      {
        name: 'prepatch',
        items: [
          ['prepatch', '2.7.5', '2.7.6-rc.0'],
          ['prerelease', '2.7.6-rc.0', '2.7.6-rc.1'],
          ['release', '2.7.6-rc.1', '2.7.6'],
        ],
      },
      {
        name: 'minor',
        items: [['minor', '2.7.5', '2.8.0']],
      },
      {
        name: 'preminor',
        items: [
          ['preminor', '2.7.5', '2.8.0-rc.0'],
          ['prerelease', '2.8.0-rc.0', '2.8.0-rc.1'],
          ['release', '2.8.0-rc.1', '2.8.0'],
        ],
      },
      {
        name: 'premajor',
        items: [
          ['premajor', '2.7.5', '3.0.0-rc.0'],
          ['prerelease', '3.0.0-rc.0', '3.0.0-rc.1'],
          ['release', '3.0.0-rc.1', '3.0.0'],
        ],
      },
    ];

    for (const group of valid) {
      describe(group.name, () => {
        it.each(group.items)(
          'should allow a $0 from $1 to $2',
          (type, version, next) => {
            expect(pump(version, type)).toEqual({
              message: next,
              exitCode: 0,
            });
          },
        );
      });
    }

    describe('invalid', () => {
      it.each([
        ['patch', 'v3.0.0-rc.0'],
        ['prepatch', 'v3.0.0-rc.0'],
        ['minor', 'v3.0.0-rc.0'],
        ['preminor', 'v3.0.0-rc.0'],
        ['premajor', 'v3.0.0-rc.0'],
        ['prerelease', 'v3.0.0'],
        ['release', 'v3.0.0'],
      ])('should not allow a $0 on $1', (type, version) => {
        expect(pump(version, type)).toEqual({
          message: expect.stringContaining('Invalid pump'),
          exitCode: 1,
        });
      });
    });
  });
});
