import { version } from '../package.json';

export interface ICliVersion {
  major: number;
  minor: number;
  patch: number;
}

export class CliVersion implements ICliVersion {
  constructor(
    public readonly major: number,
    public readonly minor: number,
    public readonly patch: number,
  ) {}

  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  toJSON() {
    const { major, minor, patch } = this;
    return { major, minor, patch };
  }

  static fromString(version: string): CliVersion {
    const regex = /v?(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/i;
    const matchResult = version.match(regex);
    if (matchResult) {
      const [, major, minor, patch] = matchResult.map(Number);
      return new CliVersion(major, minor, patch);
    } else {
      throw new Error(`Invalid version format: ${version}`);
    }
  }
}

export const cliVersion = CliVersion.fromString(version);
