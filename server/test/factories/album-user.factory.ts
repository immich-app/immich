import { Selectable } from 'kysely';
import { isUndefined, omitBy } from 'lodash';
import { AlbumUserRole } from 'src/enum';
import { AlbumUserTable } from 'src/schema/tables/album-user.table';
import { AlbumFactory } from 'test/factories/album.factory';
import { build } from 'test/factories/builder.factory';
import { AlbumUserLike, AlbumUserStub, FactoryBuilder, RelationKeysPath, UserLike } from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class AlbumUserFactory<T extends RelationKeysPath<'albumUser'> = never> {
  #user?: UserFactory;

  private constructor(private readonly value: Selectable<AlbumUserTable>) {}

  static create(dto: AlbumUserLike = {}) {
    return AlbumUserFactory.from(dto).build();
  }

  static from(dto: AlbumUserLike = {}) {
    const userId = dto.userId ?? newUuid();
    return new AlbumUserFactory({
      albumId: newUuid(),
      userId,
      role: AlbumUserRole.Editor,
      createId: newUuidV7(),
      createdAt: newDate(),
      updateId: newUuidV7(),
      updatedAt: newDate(),
      ...dto,
    }).user({ id: userId });
  }

  album(dto: AlbumUserLike = {}, builder?: FactoryBuilder<AlbumFactory>) {
    const album = build(AlbumFactory.from(dto), builder);
    this.value.albumId = album.build().id;
    return this;
  }

  user(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory<'metadata'>>) {
    const user = build(UserFactory.from(dto), builder);
    this.value.userId = user.build().id;
    this.#user = user;
    return this as AlbumUserFactory<T | 'user' | 'user.metadata'>;
  }

  build() {
    return omitBy(
      {
        ...this.value,
        user: this.#user?.build(),
      },
      isUndefined,
    ) as AlbumUserStub<T>;
  }
}
