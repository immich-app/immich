import { basename, extname } from 'node:path';
import { ImmichLogger } from 'src/infra/logger';

const KiB = Math.pow(1024, 1);
const MiB = Math.pow(1024, 2);
const GiB = Math.pow(1024, 3);
const TiB = Math.pow(1024, 4);
const PiB = Math.pow(1024, 5);

export const HumanReadableSize = { KiB, MiB, GiB, TiB, PiB };

export function asHumanReadable(bytes: number, precision = 1): string {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];

  let magnitude = 0;
  let remainder = bytes;
  while (remainder >= 1024) {
    if (magnitude + 1 < units.length) {
      magnitude++;
      remainder /= 1024;
    } else {
      break;
    }
  }

  return `${remainder.toFixed(magnitude == 0 ? 0 : precision)} ${units[magnitude]}`;
}

export const isConnectionAborted = (error: Error | any) => error.code === 'ECONNABORTED';

export function isDecimalNumber(number_: number): boolean {
  return !Number.isNaN(number_) && Number.isFinite(number_);
}

/**
 * Check if `num` is a valid number and is between `start` and `end` (inclusive)
 */
export function isNumberInRange(number_: number, start: number, end: number): boolean {
  return isDecimalNumber(number_) && number_ >= start && number_ <= end;
}

export function toNumberOrNull(input: number | string | null | undefined): number | null {
  if (input === null || input === undefined) {
    return null;
  }

  const number_ = typeof input === 'string' ? Number.parseFloat(input) : input;
  return isDecimalNumber(number_) ? number_ : null;
}

export function parseLatitude(input: string | number | null): number | null {
  if (input === null) {
    return null;
  }
  const latitude = typeof input === 'string' ? Number.parseFloat(input) : input;

  if (isNumberInRange(latitude, -90, 90)) {
    return latitude;
  }
  return null;
}

export function parseLongitude(input: string | number | null): number | null {
  if (input === null) {
    return null;
  }

  const longitude = typeof input === 'string' ? Number.parseFloat(input) : input;

  if (isNumberInRange(longitude, -180, 180)) {
    return longitude;
  }
  return null;
}

// NOTE: The following Set utils have been added here, to easily determine where they are used.
//       They should be replaced with native Set operations, when they are added to the language.
//       Proposal reference: https://github.com/tc39/proposal-set-methods

export const setUnion = <T>(...sets: Set<T>[]): Set<T> => {
  const union = new Set(sets[0]);
  for (const set of sets.slice(1)) {
    for (const element of set) {
      union.add(element);
    }
  }
  return union;
};

export const setDifference = <T>(setA: Set<T>, ...sets: Set<T>[]): Set<T> => {
  const difference = new Set(setA);
  for (const set of sets) {
    for (const element of set) {
      difference.delete(element);
    }
  }
  return difference;
};

export const setIsSuperset = <T>(set: Set<T>, subset: Set<T>): boolean => {
  for (const element of subset) {
    if (!set.has(element)) {
      return false;
    }
  }
  return true;
};

export const setIsEqual = <T>(setA: Set<T>, setB: Set<T>): boolean => {
  return setA.size === setB.size && setIsSuperset(setA, setB);
};

export const handlePromiseError = <T>(promise: Promise<T>, logger: ImmichLogger): void => {
  promise.catch((error: Error | any) => logger.error(`Promise error: ${error}`, error?.stack));
};

export enum CacheControl {
  PRIVATE_WITH_CACHE = 'private_with_cache',
  PRIVATE_WITHOUT_CACHE = 'private_without_cache',
  NONE = 'none',
}

export class ImmichFileResponse {
  public readonly path!: string;
  public readonly contentType!: string;
  public readonly cacheControl!: CacheControl;

  constructor(response: ImmichFileResponse) {
    Object.assign(this, response);
  }
}

export interface OpenGraphTags {
  title: string;
  description: string;
  imageUrl?: string;
}

export function getFileNameWithoutExtension(path: string): string {
  return basename(path, extname(path));
}

export function getLivePhotoMotionFilename(stillName: string, motionName: string) {
  return getFileNameWithoutExtension(stillName) + extname(motionName);
}

export interface PaginationOptions {
  take: number;
  skip?: number;
}

export enum PaginationMode {
  LIMIT_OFFSET = 'limit-offset',
  SKIP_TAKE = 'skip-take',
}

export interface PaginatedBuilderOptions {
  take: number;
  skip?: number;
  mode?: PaginationMode;
}

export interface PaginationResult<T> {
  items: T[];
  hasNextPage: boolean;
}

export type Paginated<T> = Promise<PaginationResult<T>>;

export async function* usePagination<T>(
  pageSize: number,
  getNextPage: (pagination: PaginationOptions) => PaginationResult<T> | Paginated<T>,
) {
  let hasNextPage = true;

  for (let skip = 0; hasNextPage; skip += pageSize) {
    const result = await getNextPage({ take: pageSize, skip });
    hasNextPage = result.hasNextPage;
    yield result.items;
  }
}
