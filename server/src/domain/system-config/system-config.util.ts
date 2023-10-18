import { ServerVersion } from '../domain.constant';

export function compareVersions(remoteVersionString: string, serverVersion: ServerVersion): boolean {
  const remoteVersion = stringToVersion(remoteVersionString);
  return remoteVersion.toString().localeCompare(serverVersion.toString(), undefined, { numeric: true }) === 1;
}

export function stringToVersion(version: string): ServerVersion {
  const matchResult = version.match(/(?:v)?(\d+)\.(\d+)\.(\d+)/i);
  if (matchResult) {
    const [, major, minor, patch] = matchResult.map(Number);
    return new ServerVersion(major, minor, patch);
  } else {
    throw new Error(`Invalid version format: ${version}`);
  }
}
