import { readFileSync, writeFileSync } from 'node:fs';

export const RELEASE_TYPES = [
  'minor',
  'patch',
  'premajor',
  'preminor',
  'prepatch',
  'prerelease',
  'release',
] as const;

export type ReleaseType = (typeof RELEASE_TYPES)[number];
export type ReleaseOptions = { type: string; mobile: boolean };

export class TextFile {
  constructor(private file: string) {}

  read() {
    return readFileSync(this.file, 'utf8');
  }

  write(contents: string) {
    writeFileSync(this.file, contents);
  }
}

export class JsonFile<T extends object> {
  private text: TextFile;

  constructor(private file: string) {
    this.text = new TextFile(file);
  }

  read() {
    return JSON.parse(this.text.read()) as T;
  }

  write<T>(contents: T) {
    return this.text.write(JSON.stringify(contents, null, 2) + '\n');
  }
}

export class ReleaseInputError extends Error {}
export class ReleaseError extends Error {
  version: string;
  newVersion: string;

  constructor(options: { version: string; newVersion: string }) {
    super(`Invalid pump`);

    this.version = options.version;
    this.newVersion = options.newVersion;
  }
}
