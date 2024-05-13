export type IVersion = { major: number; minor: number; patch: number };

export enum VersionType {
  EQUAL = 0,
  PATCH = 1,
  MINOR = 2,
  MAJOR = 3,
}

export class Version implements IVersion {
  public readonly types = ['major', 'minor', 'patch'] as const;

  constructor(
    public major: number,
    public minor: number = 0,
    public patch: number = 0,
  ) {}

  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  toJSON() {
    const { major, minor, patch } = this;
    return { major, minor, patch };
  }

  static fromString(version: string): Version {
    const regex = /v?(?<major>\d+)(?:\.(?<minor>\d+))?(?:[.-](?<patch>\d+))?/i;
    const matchResult = version.match(regex);
    if (matchResult) {
      const { major, minor = '0', patch = '0' } = matchResult.groups as { [K in keyof IVersion]: string };
      return new Version(Number(major), Number(minor), Number(patch));
    } else {
      throw new Error(`Invalid version format: ${version}`);
    }
  }

  private compare(version: Version): [number, VersionType] {
    for (const [i, key] of this.types.entries()) {
      const diff = this[key] - version[key];
      if (diff !== 0) {
        return [diff > 0 ? 1 : -1, (VersionType.MAJOR - i) as VersionType];
      }
    }

    return [0, VersionType.EQUAL];
  }

  isOlderThan(version: Version): VersionType {
    const [bool, type] = this.compare(version);
    return bool < 0 ? type : VersionType.EQUAL;
  }

  isEqual(version: Version): boolean {
    const [bool] = this.compare(version);
    return bool === 0;
  }

  isNewerThan(version: Version): VersionType {
    const [bool, type] = this.compare(version);
    return bool > 0 ? type : VersionType.EQUAL;
  }

  compareTo(other: Version) {
    if (this.isEqual(other)) {
      return 0;
    }

    return this.isNewerThan(other) ? 1 : -1;
  }
}
