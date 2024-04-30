import { SetMetadata, applyDecorators } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OnEventOptions } from '@nestjs/event-emitter/dist/interfaces';
import { ApiExtension, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import _ from 'lodash';
import { ADDED_IN_PREFIX, DEPRECATED_IN_PREFIX, LIFECYCLE_EXTENSION } from 'src/constants';
import { ServerAsyncEvent, ServerEvent } from 'src/interfaces/event.interface';
import { setUnion } from 'src/utils/set';

// PostgreSQL uses a 16-bit integer to indicate the number of bound parameters. This means that the
// maximum number of parameters is 65535. Any query that tries to bind more than that (e.g. searching
// by a list of IDs) requires splitting the query into multiple chunks.
// We are rounding down this limit, as queries commonly include other filters and parameters.
export const DATABASE_PARAMETER_CHUNK_SIZE = 65_500;

/**
 * Chunks an array or set into smaller collections of the same type and specified size.
 *
 * @param collection The collection to chunk.
 * @param size The size of each chunk.
 */
function chunks<T>(collection: Array<T>, size: number): Array<Array<T>>;
function chunks<T>(collection: Set<T>, size: number): Array<Set<T>>;
function chunks<T>(collection: Array<T> | Set<T>, size: number): Array<Array<T>> | Array<Set<T>> {
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

/**
 * Wraps a method that takes a collection of parameters and sequentially calls it with chunks of the collection,
 * to overcome the maximum number of parameters allowed by the database driver.
 *
 * @param options.paramIndex The index of the function parameter to chunk. Defaults to 0.
 * @param options.flatten Whether to flatten the results. Defaults to false.
 */
export function Chunked(options: { paramIndex?: number; mergeFn?: (results: any) => any } = {}): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const parameterIndex = options.paramIndex ?? 0;
    descriptor.value = async function (...arguments_: any[]) {
      const argument = arguments_[parameterIndex];

      // Early return if argument length is less than or equal to the chunk size.
      if (
        (Array.isArray(argument) && argument.length <= DATABASE_PARAMETER_CHUNK_SIZE) ||
        (argument instanceof Set && argument.size <= DATABASE_PARAMETER_CHUNK_SIZE)
      ) {
        return await originalMethod.apply(this, arguments_);
      }

      return Promise.all(
        chunks(argument, DATABASE_PARAMETER_CHUNK_SIZE).map(async (chunk) => {
          await Reflect.apply(originalMethod, this, [
            ...arguments_.slice(0, parameterIndex),
            chunk,
            ...arguments_.slice(parameterIndex + 1),
          ]);
        }),
      ).then((results) => (options.mergeFn ? options.mergeFn(results) : results));
    };
  };
}

export function ChunkedArray(options?: { paramIndex?: number }): MethodDecorator {
  return Chunked({ ...options, mergeFn: _.flatten });
}

export function ChunkedSet(options?: { paramIndex?: number }): MethodDecorator {
  return Chunked({ ...options, mergeFn: setUnion });
}

// https://stackoverflow.com/a/74898678
export function DecorateAll(
  decorator: <T>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>,
  ) => TypedPropertyDescriptor<T> | void,
) {
  return (target: any) => {
    const descriptors = Object.getOwnPropertyDescriptors(target.prototype);
    for (const [propName, descriptor] of Object.entries(descriptors)) {
      const isMethod = typeof descriptor.value == 'function' && propName !== 'constructor';
      if (!isMethod) {
        continue;
      }
      decorator({ ...target, constructor: { ...target.constructor, name: target.name } as any }, propName, descriptor);
      Object.defineProperty(target.prototype, propName, descriptor);
    }
  };
}

const UUID = '00000000-0000-4000-a000-000000000000';

export const DummyValue = {
  UUID,
  UUID_SET: new Set([UUID]),
  PAGINATION: { take: 10, skip: 0 },
  EMAIL: 'user@immich.app',
  STRING: 'abcdefghi',
  BUFFER: Buffer.from('abcdefghi'),
  DATE: new Date(),
  TIME_BUCKET: '2024-01-01T00:00:00.000Z',
};

export const GENERATE_SQL_KEY = 'generate-sql-key';

export interface GenerateSqlQueries {
  name?: string;
  params: unknown[];
}

/** Decorator to enable versioning/tracking of generated Sql */
export const GenerateSql = (...options: GenerateSqlQueries[]) => SetMetadata(GENERATE_SQL_KEY, options);

export const OnServerEvent = (event: ServerEvent | ServerAsyncEvent, options?: OnEventOptions) =>
  OnEvent(event, { suppressErrors: false, ...options });

type LifecycleRelease = 'NEXT_RELEASE' | string;
type LifecycleMetadata = {
  addedAt?: LifecycleRelease;
  deprecatedAt?: LifecycleRelease;
};

export const EndpointLifecycle = ({ addedAt, deprecatedAt }: LifecycleMetadata) => {
  const decorators: MethodDecorator[] = [ApiExtension(LIFECYCLE_EXTENSION, { addedAt, deprecatedAt })];
  if (deprecatedAt) {
    decorators.push(
      ApiTags('Deprecated'),
      ApiOperation({ deprecated: true, description: DEPRECATED_IN_PREFIX + deprecatedAt }),
    );
  }

  return applyDecorators(...decorators);
};

export const PropertyLifecycle = ({ addedAt, deprecatedAt }: LifecycleMetadata) => {
  const decorators: PropertyDecorator[] = [];
  decorators.push(ApiProperty({ description: ADDED_IN_PREFIX + addedAt }));
  if (deprecatedAt) {
    decorators.push(ApiProperty({ deprecated: true, description: DEPRECATED_IN_PREFIX + deprecatedAt }));
  }

  return applyDecorators(...decorators);
};
