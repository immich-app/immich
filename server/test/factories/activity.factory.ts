import { Selectable } from 'kysely';
import { ActivityTable } from 'src/schema/tables/activity.table';
import { build } from 'test/factories/builder.factory';
import { ActivityLike, FactoryBuilder, UserLike } from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class ActivityFactory {
  #user!: UserFactory;

  private constructor(private value: Selectable<ActivityTable>) {}

  static create(dto: ActivityLike = {}) {
    return ActivityFactory.from(dto).build();
  }

  static from(dto: ActivityLike = {}) {
    const userId = dto.userId ?? newUuid();
    return new ActivityFactory({
      albumId: newUuid(),
      assetId: null,
      comment: null,
      createdAt: newDate(),
      id: newUuid(),
      isLiked: false,
      userId,
      updatedAt: newDate(),
      updateId: newUuidV7(),
      ...dto,
    }).user({ id: userId });
  }

  user(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory>) {
    this.#user = build(UserFactory.from(dto), builder);
    this.value.userId = this.#user.build().id;
    return this;
  }

  build() {
    return { ...this.value, user: this.#user.build() };
  }
}
