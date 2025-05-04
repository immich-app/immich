export interface PaginationOptions {
  take: number;
  skip?: number;
}

export interface PaginationResult<T> {
  items: T[];
  hasNextPage: boolean;
  total?: number;
}

export function paginationHelper<Entity extends object>(
  items: Entity[],
  take: number,
  total?: number,
): PaginationResult<Entity> {
  const hasNextPage = items.length > take;
  items.splice(take);

  return { items, hasNextPage, total };
}
