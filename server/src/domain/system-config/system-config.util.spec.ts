import { ServerVersion } from '..';
import { compareVersions, stringToVersion } from './system-config.util';

describe('compare server versions', () => {
  test('should return true when patch version is greater', () => {
    const remoteVersion = 'v1.72.3';
    const serverVersion = new ServerVersion(1, 72, 2);

    const result = compareVersions(remoteVersion, serverVersion);

    expect(result).toBe(true);
  });

  test('should return true when minor version is greater', () => {
    const remoteVersion = 'v1.73.0';
    const serverVersion = new ServerVersion(1, 72, 2);

    const result = compareVersions(remoteVersion, serverVersion);

    expect(result).toBe(true);
  });

  test('should return true when major version is greater', () => {
    const remoteVersion = 'v2.0.0';
    const serverVersion = new ServerVersion(1, 72, 2);

    const result = compareVersions(remoteVersion, serverVersion);

    expect(result).toBe(true);
  });

  test('should return false when remote version is the same as the server version', () => {
    const remoteVersion = 'v1.72.2';
    const serverVersion = new ServerVersion(1, 72, 2);

    const result = compareVersions(remoteVersion, serverVersion);

    expect(result).toBe(false);
  });

  test('should return false when remote version is smaller', () => {
    const remoteVersion = 'v1.71.1';
    const serverVersion = new ServerVersion(1, 72, 2);

    const result = compareVersions(remoteVersion, serverVersion);

    expect(result).toBe(false);
  });
});

describe('convert string version to ServerVersion', () => {
  test('should convert valid version string to ServerVersion (with lowercase "v")', () => {
    const versionString = 'v1.72.2';

    const result = stringToVersion(versionString);

    expect(result).toEqual(new ServerVersion(1, 72, 2));
  });

  test('should convert valid version string to ServerVersion (with uppercase "v")', () => {
    const versionString = 'V1.72.2';

    const result = stringToVersion(versionString);

    expect(result).toEqual(new ServerVersion(1, 72, 2));
  });

  test('should convert valid version string to ServerVersion (without "v")', () => {
    const versionString = '1.72.2';

    const result = stringToVersion(versionString);

    expect(result).toEqual(new ServerVersion(1, 72, 2));
  });

  test('should throw error when converting invalid version string to ServerVersion', () => {
    const versionString = '1.72';
    expect(() => {
      stringToVersion(versionString);
    }).toThrowError();
  });
});
