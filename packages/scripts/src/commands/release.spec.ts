import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resolveArchivedVersions,
  ArchivedVersion,
  getNewVersion,
  ReleaseError,
} from './release';

const archived = (label: string): ArchivedVersion => ({
  label,
  url: `https://docs.${label}.archive.immich.app`,
});

const labels = (versions: ArchivedVersion[]) => versions.map((v) => v.label);

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

describe(resolveArchivedVersions.name, () => {
  beforeEach(() => {
    // silence the "Removed ..." progress logging
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should prepend the new version to the front', () => {
    const result = resolveArchivedVersions([archived('v2.9.0')], '3.0.0');

    expect(result[0]).toEqual({
      label: 'v3.0.0',
      url: 'https://docs.v3.0.0.archive.immich.app',
    });
    expect(labels(result)).toEqual(['v3.0.0', 'v2.9.0']);
  });

  it('should handle an empty list', () => {
    expect(labels(resolveArchivedVersions([], '3.0.0'))).toEqual(['v3.0.0']);
  });

  it('should drop older patch releases of the new version minor', () => {
    const versions = ['v3.0.4', 'v3.0.3', 'v3.0.2'].map(archived);

    expect(labels(resolveArchivedVersions(versions, '3.0.5'))).toEqual([
      'v3.0.5',
    ]);
  });

  it('should keep the latest patch of each older minor', () => {
    const versions = ['v3.1.2', 'v3.1.1', 'v3.0.9', 'v2.0.0'].map(archived);

    expect(labels(resolveArchivedVersions(versions, '3.2.0'))).toEqual([
      'v3.2.0',
      'v3.1.2',
      'v3.0.9',
      'v2.0.0',
    ]);
  });

  it('should keep an older minor when bumping a patch', () => {
    const versions = ['v3.0.4', 'v3.0.3', 'v2.9.1', 'v2.9.0', 'v1.5.0'].map(
      archived,
    );

    expect(labels(resolveArchivedVersions(versions, '3.0.5'))).toEqual([
      'v3.0.5',
      'v2.9.1',
      'v1.5.0',
    ]);
  });

  it('should replace a prerelease with its release', () => {
    const versions = ['v3.0.0-rc.2', 'v3.0.0-rc.1', 'v2.9.0'].map(archived);

    expect(labels(resolveArchivedVersions(versions, '3.0.0'))).toEqual([
      'v3.0.0',
      'v2.9.0',
    ]);
  });
});
