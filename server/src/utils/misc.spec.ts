import { getKeysDeep, globToPostgresRegex, unsetDeep } from 'src/utils/misc';
import { describe, expect, it } from 'vitest';

describe('getKeysDeep', () => {
  it('should handle an empty object', () => {
    expect(getKeysDeep({})).toEqual([]);
  });

  it('should list properties', () => {
    expect(
      getKeysDeep({
        foo: 'bar',
        flag: true,
        count: 42,
        date: new Date(),
      }),
    ).toEqual(['foo', 'flag', 'count', 'date']);
  });

  it('should skip undefined properties', () => {
    expect(getKeysDeep({ foo: 'bar', hello: undefined })).toEqual(['foo']);
  });

  it('should skip array indices', () => {
    expect(getKeysDeep({ foo: 'bar', hello: ['foo', 'bar'] })).toEqual(['foo', 'hello']);
    expect(getKeysDeep({ foo: 'bar', nested: { hello: ['foo', 'bar'] } })).toEqual(['foo', 'nested.hello']);
  });

  it('should list nested properties', () => {
    expect(getKeysDeep({ foo: 'bar', hello: { world: true } })).toEqual(['foo', 'hello.world']);
  });
});

describe('unsetDeep', () => {
  it('should remove a property', () => {
    expect(unsetDeep({ hello: 'world', foo: 'bar' }, 'foo')).toEqual({ hello: 'world' });
  });

  it('should remove the last property', () => {
    expect(unsetDeep({ foo: 'bar' }, 'foo')).toBeUndefined();
  });

  it('should remove a nested property', () => {
    expect(unsetDeep({ foo: 'bar', nested: { enabled: true, count: 42 } }, 'nested.enabled')).toEqual({
      foo: 'bar',
      nested: { count: 42 },
    });
  });

  it('should clean up an empty property', () => {
    expect(unsetDeep({ foo: 'bar', nested: { enabled: true } }, 'nested.enabled')).toEqual({ foo: 'bar' });
  });
});

const matches = (glob: string, value: string) => new RegExp(globToPostgresRegex(glob)).test(value);

describe('globToPostgresRegex', () => {
  const testCases: [string, string, boolean][] = [
    ['**/Raw/**', '/foo/Raw/bar.jpg', true],
    ['**/Raw/**', '/foo/bar.jpg', false],
    ['**/abc/*.tif', '/foo/abc/scan.tif', true],
    ['**/abc/*.tif', '/foo/abc/sub/scan.tif', false],
    ['**/*.tif', '/foo/bar.tif', true],
    ['**/*.jp?', '/foo/bar.jpg', true],
    ['**/@eaDir/**', '/foo/@eaDir/thumb.jpg', true],
    ['**/._*', '/foo/._resource', true],
    ['/absolute/path/**', '/absolute/path/photo.jpg', true],
    ['/absolute/path/**', '/other/path/photo.jpg', false],
    // a bare `*` must not cross a path separator, unlike SQL `LIKE`'s `%`
    ['/path/*.*', '/path/photo.jpg', true],
    ['/path/*.*', '/path/2020/photo.jpg', false],
  ];

  it.each(testCases)('should match %s against %s as %s', (glob, value, expected) => {
    expect(matches(glob, value)).toEqual(expected);
  });
});
