import { faker } from '@faker-js/faker';
import { PersonType, type PersonResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';

export const personFactory = Sync.makeFactory<PersonResponseDto>({
  birthDate: Sync.each(() => faker.date.past().toISOString()),
  id: Sync.each(() => faker.string.uuid()),
  isHidden: Sync.each(() => faker.datatype.boolean()),
  name: Sync.each(() => faker.person.fullName()),
  thumbnailPath: Sync.each(() => faker.system.filePath()),
  type: PersonType.Human,
  updatedAt: Sync.each(() => faker.date.recent().toISOString()),
});
