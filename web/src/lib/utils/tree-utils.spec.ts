import type { TagResponseDto } from '@immich/sdk';
import { TreeNode } from '$lib/utils/tree-utils';

const makeTag = (value: string, id = value): TagResponseDto =>
  ({
    id,
    value,
    color: undefined,
    createdAt: '',
    updatedAt: '',
    parentId: undefined,
  }) as unknown as TagResponseDto;

describe('TreeNode.children', () => {
  it('sorts sibling nodes using natural (numeric-aware) order', () => {
    // Insertion order is intentionally not sorted to prove the getter sorts.
    const tags = ['10) item', '2) item', '1) item', '20) item', '3) item'].map((value) => makeTag(`parent/${value}`));

    const root = TreeNode.fromTags(tags);
    const [parent] = root.children;

    expect(parent.children.map((c) => c.value)).toEqual(['1) item', '2) item', '3) item', '10) item', '20) item']);
  });

  it('sorts alphabetically when there are no numbers', () => {
    const tags = ['banana', 'apple', 'cherry'].map((v) => makeTag(v));
    const root = TreeNode.fromTags(tags);
    expect(root.children.map((c) => c.value)).toEqual(['apple', 'banana', 'cherry']);
  });

  it('is case-insensitive at the base sensitivity level', () => {
    const tags = ['Banana', 'apple', 'Cherry'].map((v) => makeTag(v));
    const root = TreeNode.fromTags(tags);
    expect(root.children.map((c) => c.value)).toEqual(['apple', 'Banana', 'Cherry']);
  });
});
