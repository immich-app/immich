import { faker } from '@faker-js/faker';
import { SharedLinkType, type SharedLinkResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';

export const sharedLinkFactory = Sync.makeFactory<SharedLinkResponseDto>({
  id: Sync.each(() => faker.string.uuid()),
  description: Sync.each(() => faker.word.sample()),
  password: Sync.each(() => faker.word.sample()),
  token: Sync.each(() => faker.word.sample()),
  userId: Sync.each(() => faker.string.uuid()),
  key: Sync.each(() => faker.word.sample()),
  type: Sync.each(() => faker.helpers.enumValue(SharedLinkType)),
  createdAt: Sync.each(() => faker.date.past().toISOString()),
  expiresAt: Sync.each(() => faker.date.past().toISOString()),
  assets: [],
  allowUpload: Sync.each(() => faker.datatype.boolean()),
  allowDownload: Sync.each(() => faker.datatype.boolean()),
  showMetadata: Sync.each(() => faker.datatype.boolean()),
});
