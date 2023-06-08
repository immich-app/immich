import { Paginated, PaginationOptions } from '@app/domain';
import { FindOneOptions, ObjectLiteral, Repository } from 'typeorm';

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
