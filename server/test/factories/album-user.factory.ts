import { Selectable } from 'kysely';
import { AlbumUserRole } from 'src/enum';
import { AlbumUserTable } from 'src/schema/tables/album-user.table';
import { AlbumFactory } from 'test/factories/album.factory';
import { build } from 'test/factories/builder.factory';
import { AlbumUserLike, FactoryBuilder, UserLike } from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

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
