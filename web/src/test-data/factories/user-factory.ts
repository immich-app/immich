import { faker } from '@faker-js/faker';
import { UserAvatarColor, type UserResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';

export const userFactory = Sync.makeFactory<UserResponseDto>({
  id: Sync.each(() => faker.string.uuid()),
  email: Sync.each(() => faker.internet.email()),
  name: Sync.each(() => faker.person.fullName()),
  profileImagePath: '',
  avatarColor: UserAvatarColor.Primary,
});
