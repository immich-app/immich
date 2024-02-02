import { Paginated, PaginationOptions } from '@app/domain';
import _ from 'lodash';
import { Between, FindManyOptions, LessThanOrEqual, MoreThanOrEqual, ObjectLiteral, Repository } from 'typeorm';
import { chunks, setUnion } from '../domain/domain.util';
import { DATABASE_PARAMETER_CHUNK_SIZE } from './infra.util';

/**
 * Allows optional values unlike the regular Between and uses MoreThanOrEqual
 * or LessThanOrEqual when only one parameter is specified.
 */
export function OptionalBetween<T>(from?: T, to?: T) {
  if (from && to) {
    return Between(from, to);
  } else if (from) {
    return MoreThanOrEqual(from);
  } else if (to) {
    return LessThanOrEqual(to);
  }
}

export async function paginate<Entity extends ObjectLiteral>(
  repository: Repository<Entity>,
  paginationOptions: PaginationOptions,
  searchOptions?: FindManyOptions<Entity>,
): Paginated<Entity> {
  const items = await repository.find(
    _.omitBy(
      {
        ...searchOptions,
        // Take one more item to check if there's a next page
        take: paginationOptions.take + 1,
        skip: paginationOptions.skip,
      },
      _.isUndefined,
    ),
  );

  const hasNextPage = items.length > paginationOptions.take;
  items.splice(paginationOptions.take);

  return { items, hasNextPage };
}

export const asVector = (embedding: number[], quote = false) =>
  quote ? `'[${embedding.join(',')}]'` : `[${embedding.join(',')}]`;

export const isValidInteger = (value: number, options: { min?: number; max?: number }): value is number => {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;
  return Number.isInteger(value) && value >= min && value <= max;
};

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
