import { Selectable } from 'kysely';
import { isUndefined, omitBy } from 'lodash';
import { SharedLinkType } from 'src/enum';
import { SharedLinkTable } from 'src/schema/tables/shared-link.table';
import { AlbumFactory } from 'test/factories/album.factory';
import { build } from 'test/factories/builder.factory';
import {
  AlbumLike,
  FactoryBuilder,
  RelationKeysPath,
  SharedLinkLike,
  SharedLinkStub,
  UserLike,
} from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { factory, newDate, newUuid } from 'test/small.factory';

export class SharedLinkFactory<T extends RelationKeysPath<'sharedLink'> = never> {
  #owner?: UserFactory;
  #album?: AlbumFactory;

  private constructor(private readonly value: Selectable<SharedLinkTable>) {}

  static create(dto: SharedLinkLike = {}) {
    return SharedLinkFactory.from(dto).build();
  }

  static from(dto: SharedLinkLike = {}) {
    const type = dto.type ?? SharedLinkType.Individual;
    const albumId = (dto.albumId ?? type === SharedLinkType.Album) ? newUuid() : null;

    return new SharedLinkFactory({
      id: factory.uuid(),
      description: 'Shared link description',
      userId: newUuid(),
      key: factory.buffer(),
      type,
      albumId,
      createdAt: newDate(),
      expiresAt: null,
      allowUpload: true,
      allowDownload: true,
      showExif: true,
      password: null,
      slug: null,
      ...dto,
    }).owner();
  }

  owner(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory>) {
    this.#owner = build(UserFactory.from(dto), builder);
    return this as SharedLinkFactory<T | 'owner'>;
  }

  album(dto: AlbumLike = {}, builder?: FactoryBuilder<AlbumFactory>) {
    this.#album = build(AlbumFactory.from(dto), builder);
    return this as SharedLinkFactory<T | 'album'>;
  }

  build() {
    return omitBy(
      {
        ...this.value,
        owner: this.#owner?.build(),
        album: this.#album?.build(),
        assets: undefined,
      },
      isUndefined,
    ) as SharedLinkStub<T>;
  }
}
