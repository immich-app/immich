import { Tag } from 'src/database.js';
import { TagRepository } from 'src/repositories/tag.repository.js';

type UpsertRequest = { userId: string; tags: string[] };

export const tagPathParts = (path: string) => path.split('/').filter(Boolean);

export const tagPaths = (tags: string[]) => [
  ...new Set(
    tags.flatMap((tag) => {
      const parts = tagPathParts(tag);
      return parts.map((_, index) => parts.slice(0, index + 1).join('/'));
    }),
  ),
];

export const upsertTags = async (repository: TagRepository, { userId, tags }: UpsertRequest) => {
  tags = [...new Set(tags)];

  const results: Tag[] = [];

  for (const tag of tags) {
    const parts = tagPathParts(tag);
    let parent: Tag | undefined;

    for (const part of parts) {
      const value = parent ? `${parent.value}/${part}` : part;
      parent = await repository.upsertValue({ userId, value, parentId: parent?.id });
    }

    if (parent) {
      results.push(parent);
    }
  }

  return results;
};
