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
import { basename, extname } from 'node:path';
import sanitize from 'sanitize-filename';

export type Options = {
  optional?: boolean;
  each?: boolean;
};

export function ValidateUUID({ optional, each }: Options = { optional: false, each: false }) {
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
  } catch (error) {
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

export const toSanitized = ({ value }: IValue) => sanitize((value || '').replace(/\./g, ''));

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

  return ValidateIf((obj: any, v: any) => v !== undefined, validationOptions);
}
