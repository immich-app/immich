import { Selectable } from 'kysely';
import { UserStatus } from 'src/enum';
import { UserMetadataTable } from 'src/schema/tables/user-metadata.table';
import { UserTable } from 'src/schema/tables/user.table';
import { UserLike } from 'test/factories/types';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class UserFactory {
  private constructor(private value: Selectable<UserTable>) {}

  static create(dto: UserLike = {}) {
    return UserFactory.from(dto).build();
  }

  static from(dto: UserLike = {}) {
    return new UserFactory({
      id: newUuid(),
      email: 'test@immich.cloud',
      password: '',
      pinCode: null,
      createdAt: newDate(),
      profileImagePath: '',
      isAdmin: false,
      shouldChangePassword: false,
      avatarColor: null,
      deletedAt: null,
      oauthId: '',
      updatedAt: newDate(),
      storageLabel: null,
      name: 'Test User',
      quotaSizeInBytes: null,
      quotaUsageInBytes: 0,
      status: UserStatus.Active,
      profileChangedAt: newDate(),
      updateId: newUuidV7(),
      ...dto,
    });
  }

  build() {
    return {
      ...this.value,
      metadata: [] as UserMetadataTable[],
    };
  }
}
