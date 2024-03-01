import { faker } from '@faker-js/faker';
import { UserAvatarColor, type UserResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';

export const userFactory = Sync.makeFactory<UserResponseDto>({
  id: Sync.each(() => faker.string.uuid()),
  email: Sync.each(() => faker.internet.email()),
  name: Sync.each(() => faker.person.fullName()),
  storageLabel: Sync.each(() => faker.string.alphanumeric()),
  profileImagePath: '',
  shouldChangePassword: Sync.each(() => faker.datatype.boolean()),
  isAdmin: true,
  createdAt: Sync.each(() => faker.date.past().toISOString()),
  deletedAt: null,
  updatedAt: Sync.each(() => faker.date.past().toISOString()),
  memoriesEnabled: true,
  oauthId: '',
  avatarColor: UserAvatarColor.Primary,
  quotaUsageInBytes: 0,
  quotaSizeInBytes: null,
});
