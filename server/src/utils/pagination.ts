import _ from 'lodash';
import { PaginationMode } from 'src/enum';
import { FindManyOptions, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

export interface PaginationOptions {
  take: number;
  skip?: number;
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

function paginationHelper<Entity extends ObjectLiteral>(items: Entity[], take: number): PaginationResult<Entity> {
  const hasNextPage = items.length > take;
  items.splice(take);

  return { items, hasNextPage };
}

export async function paginate<Entity extends ObjectLiteral>(
  repository: Repository<Entity>,
  { take, skip }: PaginationOptions,
  searchOptions?: FindManyOptions<Entity>,
): Paginated<Entity> {
  const items = await repository.find(
    _.omitBy(
      {
        ...searchOptions,
        // Take one more item to check if there's a next page
        take: take + 1,
        skip,
      },
      _.isUndefined,
    ),
  );

  return paginationHelper(items, take);
}

export async function paginatedBuilder<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  { take, skip, mode }: PaginatedBuilderOptions,
): Paginated<Entity> {
  if (mode === PaginationMode.LIMIT_OFFSET) {
    qb.limit(take + 1).offset(skip);
  } else {
    qb.take(take + 1).skip(skip);
  }

  const items = await qb.getMany();
  return paginationHelper(items, take);
}
