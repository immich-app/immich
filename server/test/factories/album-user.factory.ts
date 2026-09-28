import { Selectable } from 'kysely';
import { AlbumUserRole } from 'src/enum.js';
import { AlbumUserTable } from 'src/schema/tables/album-user.table.js';
import { AlbumFactory } from 'test/factories/album.factory.js';
import { build } from 'test/factories/builder.factory.js';
import { AlbumUserLike, FactoryBuilder, UserLike } from 'test/factories/types.js';
import { UserFactory } from 'test/factories/user.factory.js';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory.js';

export class AlbumUserFactory {
  #user!: UserFactory;

  private constructor(private readonly value: Selectable<AlbumUserTable>) {
    value.userId ??= newUuid();
    this.#user = UserFactory.from({ id: value.userId });
  }

  static create(dto: AlbumUserLike = {}) {
    return AlbumUserFactory.from(dto).build();
  }

  static from(dto: AlbumUserLike = {}) {
    return new AlbumUserFactory({
      albumId: newUuid(),
      userId: newUuid(),
      role: AlbumUserRole.Editor,
      createId: newUuidV7(),
      createdAt: newDate(),
      updateId: newUuidV7(),
      updatedAt: newDate(),
      ...dto,
    });
  }

  album(dto: AlbumUserLike = {}, builder?: FactoryBuilder<AlbumFactory>) {
    const album = build(AlbumFactory.from(dto), builder);
    this.value.albumId = album.build().id;
    return this;
  }

  user(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory>) {
    const user = build(UserFactory.from(dto), builder);
    this.value.userId = user.build().id;
    this.#user = user;
    return this;
  }

  build() {
    return {
      ...this.value,
      user: this.#user.build(),
    };
  }
}
