import { TagEntity } from 'src/entities/tag.entity';
import { ITagRepository } from 'src/interfaces/tag.interface';

type UpsertRequest = { userId: string; tags: string[] };
export const upsertTags = async (repository: ITagRepository, { userId, tags }: UpsertRequest) => {
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
