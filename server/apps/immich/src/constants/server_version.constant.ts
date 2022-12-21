// major.minor.patch+build
// check mobile/pubspec.yml for current release version

export interface IServerVersion {
  major: number;
  minor: number;
  patch: number;
  build: number;
}

export const serverVersion: IServerVersion = {
  major: 1,
  minor: 39,
  patch: 0,
  build: 61,
};

export const SERVER_VERSION = `${serverVersion.major}.${serverVersion.minor}.${serverVersion.patch}`;
