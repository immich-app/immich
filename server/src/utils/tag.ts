import { TagEntity } from 'src/entities/tag.entity';
import { TagRepository } from 'src/repositories/tag.repository';

type UpsertRequest = { userId: string; tags: string[] };
export const upsertTags = async (repository: TagRepository, { userId, tags }: UpsertRequest) => {
  tags = [...new Set(tags)];

  const results: TagEntity[] = [];

  for (const tag of tags) {
    const parts = tag.split('/').filter(Boolean);
    let parent: TagEntity | undefined;

    for (const part of parts) {
      const value = parent ? `${parent.value}/${part}` : part;
      parent = await repository.upsertValue({ userId, value, parent });
    }

    if (parent) {
      results.push(parent);
    }
  }

  return results;
};
