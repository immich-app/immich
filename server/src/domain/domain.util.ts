import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidationOptions,
} from 'class-validator';
import { CronJob } from 'cron';
import _ from 'lodash';
import { basename, extname } from 'node:path';
import sanitize from 'sanitize-filename';

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

export type Options = {
  optional?: boolean;
  each?: boolean;
};

export const isConnectionAborted = (error: Error | any) => error.code === 'ECONNABORTED';

export function ValidateUUID(options?: Options) {
  const { optional, each } = { optional: false, each: false, ...options };
  return applyDecorators(
    IsUUID('4', { each }),
    ApiProperty({ format: 'uuid' }),
    optional ? Optional() : IsNotEmpty(),
    each ? IsArray() : IsString(),
  );
}

export function validateCronExpression(expression: string) {
  try {
    new CronJob(expression, () => {});
  } catch {
    return false;
  }

  return true;
}

interface IValue {
  value?: string;
}

export const QueryBoolean = ({ optional }: { optional?: boolean }) => {
  const decorators = [IsBoolean(), Transform(toBoolean)];
  if (optional) {
    decorators.push(Optional());
  }
  return applyDecorators(...decorators);
};

export const QueryDate = ({ optional }: { optional?: boolean }) => {
  const decorators = [IsDate(), Type(() => Date)];
  if (optional) {
    decorators.push(Optional());
  }
  return applyDecorators(...decorators);
};

export const toBoolean = ({ value }: IValue) => {
  if (value == 'true') {
    return true;
  } else if (value == 'false') {
    return false;
  }
  return value;
};

export const toEmail = ({ value }: IValue) => value?.toLowerCase();

export const toSanitized = ({ value }: IValue) => sanitize((value || '').replaceAll('.', ''));

export function getFileNameWithoutExtension(path: string): string {
  return basename(path, extname(path));
}

export function getLivePhotoMotionFilename(stillName: string, motionName: string) {
  return getFileNameWithoutExtension(stillName) + extname(motionName);
}

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

export interface PaginationOptions {
  take: number;
  skip?: number;
}

export interface PaginationResult<T> {
  items: T[];
  hasNextPage: boolean;
}

export type Paginated<T> = Promise<PaginationResult<T>>;

export async function* usePagination<T>(
  pageSize: number,
  getNextPage: (pagination: PaginationOptions) => Paginated<T>,
) {
  let hasNextPage = true;

  for (let skip = 0; hasNextPage; skip += pageSize) {
    const result = await getNextPage({ take: pageSize, skip });
    hasNextPage = result.hasNextPage;
    yield result.items;
  }
}

export interface OptionalOptions extends ValidationOptions {
  nullable?: boolean;
}

/**
 * Checks if value is missing and if so, ignores all validators.
 *
 * @param validationOptions {@link OptionalOptions}
 *
 * @see IsOptional exported from `class-validator.
 */
// https://stackoverflow.com/a/71353929
export function Optional({ nullable, ...validationOptions }: OptionalOptions = {}) {
  if (nullable === true) {
    return IsOptional(validationOptions);
  }

  return ValidateIf((object: any, v: any) => v !== undefined, validationOptions);
}

/**
 * Chunks an array or set into smaller collections of the same type and specified size.
 *
 * @param collection The collection to chunk.
 * @param size The size of each chunk.
 */
export function chunks<T>(collection: Array<T>, size: number): Array<Array<T>>;
export function chunks<T>(collection: Set<T>, size: number): Array<Set<T>>;
export function chunks<T>(collection: Array<T> | Set<T>, size: number): Array<Array<T>> | Array<Set<T>> {
  if (collection instanceof Set) {
    const result = [];
    let chunk = new Set<T>();
    for (const element of collection) {
      chunk.add(element);
      if (chunk.size === size) {
        result.push(chunk);
        chunk = new Set<T>();
      }
    }
    if (chunk.size > 0) {
      result.push(chunk);
    }
    return result;
  } else {
    return _.chunk(collection, size);
  }
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
