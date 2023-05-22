import { FindOneOptions, ObjectLiteral, Repository } from 'typeorm';

export interface PaginationOptions {
  take: number;
  skip?: number;
}

export interface PaginationResult<T> {
  items: T[];
  hasNextPage: boolean;
}

export type Paginated<T> = Promise<PaginationResult<T>>;

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
