import { Selectable } from 'kysely';
import { PersonUserTable } from 'src/schema/tables/person-user.table';
import { build } from 'test/factories/builder.factory';
import { FactoryBuilder, PersonUserLike, UserLike } from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class PersonUserFactory {
  #owner: UserFactory;

  private constructor(private readonly value: Selectable<PersonUserTable>) {
    this.#owner = UserFactory.from({ id: value.ownerId });
  }

  static create(dto: PersonUserLike = {}) {
    return PersonUserFactory.from(dto).build();
  }

  static from(dto: PersonUserLike = {}) {
    return new PersonUserFactory({
      createdAt: newDate(),
      personId: newUuid(),
      ownerId: newUuid(),
      isFavorite: false,
      isHidden: false,
      updatedAt: newDate(),
      updateId: newUuidV7(),
      thumbnailFaceAssetId: newUuid(),
      thumbnailPath: '/data/thumbs/person-thumbnail.jpg',
      ...dto,
    });
  }

  user(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory>) {
    const user = build(UserFactory.from(dto), builder);
    this.value.ownerId = user.build().id;
    this.#owner = user;
    return this;
  }

  build() {
    return {
      ...this.value,
      user: this.#owner.build(),
    };
  }
}
