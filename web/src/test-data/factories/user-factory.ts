import { faker } from '@faker-js/faker';
import { UserAvatarColor, UserStatus, type UserAdminResponseDto, type UserResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';

export const userFactory = Sync.makeFactory<UserResponseDto>({
  id: Sync.each(() => faker.string.uuid()),
  email: Sync.each(() => faker.internet.email()),
  name: Sync.each(() => faker.person.fullName()),
  profileImagePath: '',
  avatarColor: UserAvatarColor.Primary,
  profileChangedAt: Sync.each(() => faker.date.recent().toISOString()),
});

export const userAdminFactory = Sync.makeFactory<UserAdminResponseDto>({
  id: Sync.each(() => faker.string.uuid()),
  email: Sync.each(() => faker.internet.email()),
  name: Sync.each(() => faker.person.fullName()),
  profileImagePath: '',
  avatarColor: UserAvatarColor.Primary,
  isAdmin: true,
  createdAt: Sync.each(() => faker.date.recent().toISOString()),
  updatedAt: Sync.each(() => faker.date.recent().toISOString()),
  deletedAt: null,
  oauthId: '',
  quotaUsageInBytes: 0,
  quotaSizeInBytes: 1000,
  shouldChangePassword: false,
  status: UserStatus.Active,
  storageLabel: null,
  license: {
    licenseKey: 'IMCL-license-key',
    activationKey: 'activation-key',
    activatedAt: new Date().toISOString(),
  },
  profileChangedAt: Sync.each(() => faker.date.recent().toISOString()),
});
