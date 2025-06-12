import { faker } from '@faker-js/faker';
import type { TagResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';

export const tagFactory = Sync.makeFactory<TagResponseDto>({
  name: faker.string.alphanumeric(),
  value: faker.string.alphanumeric(),
  id: faker.string.uuid(),
  parentId: faker.string.uuid(),
  color: '',
  createdAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
});
