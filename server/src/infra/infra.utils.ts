import { Paginated, PaginationOptions } from '@app/domain';
import { Between, FindOneOptions, LessThanOrEqual, MoreThanOrEqual, ObjectLiteral, Repository } from 'typeorm';

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
  searchOptions?: FindOneOptions<Entity>,
): Paginated<Entity> {
  const items = await repository.find({
    ...searchOptions,
    // Take one more item to check if there's a next page
    take: paginationOptions.take + 1,
    skip: paginationOptions.skip,
  });

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
