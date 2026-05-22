import { Tag } from 'src/database';
import { TagRepository } from 'src/repositories/tag.repository';

type UpsertRequest = { userId: string; tags: string[] };
export const upsertTags = async (repository: TagRepository, { userId, tags }: UpsertRequest) => {
  tags = [...new Set(tags)];

  const results: Tag[] = [];

  for (const tag of tags) {
    const parts = tag.split('/').filter(Boolean);
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
