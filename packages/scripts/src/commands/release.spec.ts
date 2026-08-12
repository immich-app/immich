import semver from 'semver';
import { describe, expect, it } from 'vitest';
import { getMobileBuild, getNewVersion, ReleaseError } from './release';

const mobileBuild = (version: string) =>
  getMobileBuild(semver.parse(version) as semver.SemVer);

describe(getNewVersion.name, () => {
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
            expect(getNewVersion(version, type)).toEqual(next);
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
        expect(() => getNewVersion(version, type)).toThrow(ReleaseError);
      });
    });
  });
});

describe(getMobileBuild.name, () => {
  it('should encode the version', () => {
    expect(mobileBuild('3.1.0')).toBe(3_010_099);
    expect(mobileBuild('3.1.4')).toBe(3_010_499);
    expect(mobileBuild('3.2.0-rc.0')).toBe(3_020_000);
    expect(mobileBuild('3.2.0-rc.3')).toBe(3_020_003);
  });

  it('should be above the last hand-maintained build number', () => {
    expect(mobileBuild('3.1.0')).toBeGreaterThan(3057);
  });

  it('should stay under the play store limit', () => {
    expect(mobileBuild('99.99.99')).toBeLessThan(2_100_000_000);
  });

  it('should increase across a release cycle', () => {
    const versions = [
      '3.1.0',
      '3.1.1',
      '3.2.0-rc.0',
      '3.2.0-rc.1',
      '3.2.0',
      '3.2.1',
      '3.3.0-rc.0',
      '4.0.0-rc.0',
      '4.0.0',
    ];

    const builds = versions.map((version) => mobileBuild(version));
    expect(builds).toEqual([...builds].sort((a, b) => a - b));
    expect(new Set(builds).size).toBe(builds.length);
  });

  it('should rank a release above its own candidates', () => {
    expect(mobileBuild('3.2.0')).toBeGreaterThan(mobileBuild('3.2.0-rc.98'));
  });

  it('should rank a patch on an older line below the newer line', () => {
    expect(mobileBuild('3.1.5')).toBeLessThan(mobileBuild('3.2.0'));
  });

  it('should refuse versions it cannot encode', () => {
    expect(() => mobileBuild('100.0.0')).toThrow('Cannot derive');
    expect(() => mobileBuild('3.100.0')).toThrow('Cannot derive');
    expect(() => mobileBuild('3.1.100')).toThrow('Cannot derive');
    expect(() => mobileBuild('3.1.0-rc.99')).toThrow('Cannot derive');
    expect(() => mobileBuild('3.1.0-beta')).toThrow('Cannot derive');
    expect(() => mobileBuild('3.1.0-rc.-1')).toThrow('Cannot derive');
    expect(() => mobileBuild('3.1.0-rc.x')).toThrow('Cannot derive');
  });
});
