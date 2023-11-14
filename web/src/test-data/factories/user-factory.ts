import { UserAvatarColor, type UserResponseDto } from '@api';
import { faker } from '@faker-js/faker';
import { Sync } from 'factory.ts';

export const userFactory = Sync.makeFactory<UserResponseDto>({
  id: Sync.each(() => faker.datatype.uuid()),
  email: Sync.each(() => faker.internet.email()),
  name: Sync.each(() => faker.name.fullName()),
  storageLabel: Sync.each(() => faker.random.alphaNumeric()),
  externalPath: Sync.each(() => faker.random.alphaNumeric()),
  profileImagePath: '',
  shouldChangePassword: Sync.each(() => faker.datatype.boolean()),
  isAdmin: true,
  createdAt: Sync.each(() => faker.date.past().toISOString()),
  deletedAt: null,
  updatedAt: Sync.each(() => faker.date.past().toISOString()),
  memoriesEnabled: true,
  oauthId: '',
  avatarColor: UserAvatarColor.Primary,
});
