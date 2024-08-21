import { TagEntity } from 'src/entities/tag.entity';
import { ITagRepository } from 'src/interfaces/tag.interface';

type UpsertRequest = { userId: string; tags: string[] };
export const upsertTags = async (repository: ITagRepository, { userId, tags }: UpsertRequest) => {
  const results: TagEntity[] = [];

  for (const tag of tags) {
    const parts = tag.split('/');
    let parent: TagEntity | undefined;

    for (const part of parts) {
      const value = parent ? `${parent.value}/${part}` : part;
      let tag = await repository.getByValue(userId, value);
      if (!tag) {
        tag = await repository.create({ userId, value, parent });
      }

      parent = tag;
    }

    if (parent) {
      results.push(parent);
    }
  }

  return results;
};
