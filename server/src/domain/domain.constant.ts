import { AssetType } from '@app/infra/entities';
import { Duration } from 'luxon';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

export const AUDIT_LOG_MAX_DURATION = Duration.fromObject({ days: 100 });
export const ONE_HOUR = Duration.fromObject({ hours: 1 });

export interface IVersion {
  major: number;
  minor: number;
  patch: number;
}

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
}

export const envName = (process.env.NODE_ENV || 'development').toUpperCase();
export const isDev = process.env.NODE_ENV === 'development';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));
export const serverVersion = Version.fromString(version);

export const APP_MEDIA_LOCATION = process.env.IMMICH_MEDIA_LOCATION || './upload';

export const WEB_ROOT_PATH = join(process.env.IMMICH_WEB_ROOT || '/usr/src/app/www', 'index.html');

const GEODATA_ROOT_PATH = process.env.IMMICH_REVERSE_GEOCODING_ROOT || '/usr/src/resources';

export const citiesFile = 'cities500.txt';
export const geodataDatePath = join(GEODATA_ROOT_PATH, 'geodata-date.txt');
export const geodataAdmin1Path = join(GEODATA_ROOT_PATH, 'admin1CodesASCII.txt');
export const geodataAdmin2Path = join(GEODATA_ROOT_PATH, 'admin2Codes.txt');
export const geodataCitites500Path = join(GEODATA_ROOT_PATH, citiesFile);

const image: Record<string, string[]> = {
  '.3fr': ['image/3fr', 'image/x-hasselblad-3fr'],
  '.ari': ['image/ari', 'image/x-arriflex-ari'],
  '.arw': ['image/arw', 'image/x-sony-arw'],
  '.avif': ['image/avif'],
  '.bmp': ['image/bmp'],
  '.cap': ['image/cap', 'image/x-phaseone-cap'],
  '.cin': ['image/cin', 'image/x-phantom-cin'],
  '.cr2': ['image/cr2', 'image/x-canon-cr2'],
  '.cr3': ['image/cr3', 'image/x-canon-cr3'],
  '.crw': ['image/crw', 'image/x-canon-crw'],
  '.dcr': ['image/dcr', 'image/x-kodak-dcr'],
  '.dng': ['image/dng', 'image/x-adobe-dng'],
  '.erf': ['image/erf', 'image/x-epson-erf'],
  '.fff': ['image/fff', 'image/x-hasselblad-fff'],
  '.gif': ['image/gif'],
  '.heic': ['image/heic'],
  '.heif': ['image/heif'],
  '.hif': ['image/hif'],
  '.iiq': ['image/iiq', 'image/x-phaseone-iiq'],
  '.insp': ['image/jpeg'],
  '.jpe': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.jpg': ['image/jpeg'],
  '.jxl': ['image/jxl'],
  '.k25': ['image/k25', 'image/x-kodak-k25'],
  '.kdc': ['image/kdc', 'image/x-kodak-kdc'],
  '.mrw': ['image/mrw', 'image/x-minolta-mrw'],
  '.nef': ['image/nef', 'image/x-nikon-nef'],
  '.orf': ['image/orf', 'image/x-olympus-orf'],
  '.ori': ['image/ori', 'image/x-olympus-ori'],
  '.pef': ['image/pef', 'image/x-pentax-pef'],
  '.png': ['image/png'],
  '.psd': ['image/psd', 'image/vnd.adobe.photoshop'],
  '.raf': ['image/raf', 'image/x-fuji-raf'],
  '.raw': ['image/raw', 'image/x-panasonic-raw'],
  '.rw2': ['image/rw2', 'image/x-panasonic-rw2'],
  '.rwl': ['image/rwl', 'image/x-leica-rwl'],
  '.sr2': ['image/sr2', 'image/x-sony-sr2'],
  '.srf': ['image/srf', 'image/x-sony-srf'],
  '.srw': ['image/srw', 'image/x-samsung-srw'],
  '.tif': ['image/tiff'],
  '.tiff': ['image/tiff'],
  '.webp': ['image/webp'],
  '.x3f': ['image/x3f', 'image/x-sigma-x3f'],
};

const profileExtensions = new Set(['.avif', '.dng', '.heic', '.heif', '.jpeg', '.jpg', '.png', '.webp']);
const profile: Record<string, string[]> = Object.fromEntries(
  Object.entries(image).filter(([key]) => profileExtensions.has(key)),
);

const video: Record<string, string[]> = {
  '.3gp': ['video/3gpp'],
  '.avi': ['video/avi', 'video/msvideo', 'video/vnd.avi', 'video/x-msvideo'],
  '.flv': ['video/x-flv'],
  '.insv': ['video/mp4'],
  '.m2ts': ['video/mp2t'],
  '.m4v': ['video/x-m4v'],
  '.mkv': ['video/x-matroska'],
  '.mov': ['video/quicktime'],
  '.mp4': ['video/mp4'],
  '.mpg': ['video/mpeg'],
  '.mts': ['video/mp2t'],
  '.webm': ['video/webm'],
  '.wmv': ['video/x-ms-wmv'],
};

const sidecar: Record<string, string[]> = {
  '.xmp': ['application/xml', 'text/xml'],
};

const isType = (filename: string, r: Record<string, string[]>) => extname(filename).toLowerCase() in r;

const lookup = (filename: string) =>
  ({ ...image, ...video, ...sidecar })[extname(filename).toLowerCase()]?.[0] ?? 'application/octet-stream';

export const mimeTypes = {
  image,
  profile,
  sidecar,
  video,

  isAsset: (filename: string) => isType(filename, image) || isType(filename, video),
  isImage: (filename: string) => isType(filename, image),
  isProfile: (filename: string) => isType(filename, profile),
  isSidecar: (filename: string) => isType(filename, sidecar),
  isVideo: (filename: string) => isType(filename, video),
  lookup,
  assetType: (filename: string) => {
    const contentType = lookup(filename);
    if (contentType.startsWith('image/')) {
      return AssetType.IMAGE;
    } else if (contentType.startsWith('video/')) {
      return AssetType.VIDEO;
    }
    return AssetType.OTHER;
  },
  getSupportedFileExtensions: () => [...Object.keys(image), ...Object.keys(video)],
};
