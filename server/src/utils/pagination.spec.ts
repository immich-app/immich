import { paginationHelper } from 'src/utils/pagination';
import { describe, expect, it } from 'vitest';

describe('paginationHelper', () => {
  it('should return hasNextPage false when items length is less than take', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const result = paginationHelper(items, 5);

    expect(result).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      hasNextPage: false,
    });
  });

  it('should return hasNextPage false when items length equals take', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = paginationHelper(items, 3);

    expect(result).toEqual({
      items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      hasNextPage: false,
    });
  });

  it('should return hasNextPage true and truncate when items length exceeds take', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const result = paginationHelper(items, 3);

    expect(result).toEqual({
      items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      hasNextPage: true,
    });
  });

  it('should return empty items with hasNextPage false for an empty array', () => {
    const items: object[] = [];
    const result = paginationHelper(items, 10);

    expect(result).toEqual({
      items: [],
      hasNextPage: false,
    });
  });

  it('should handle take of 1 with multiple items', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const result = paginationHelper(items, 1);

    expect(result).toEqual({
      items: [{ id: 1 }],
      hasNextPage: true,
    });
  });

  it('should handle take of 1 with a single item', () => {
    const items = [{ id: 1 }];
    const result = paginationHelper(items, 1);

    expect(result).toEqual({
      items: [{ id: 1 }],
      hasNextPage: false,
    });
  });

  it('should mutate the original array by splicing extra items', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    paginationHelper(items, 2);

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should return the same array reference in items', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const result = paginationHelper(items, 5);

    expect(result.items).toBe(items);
  });
});
