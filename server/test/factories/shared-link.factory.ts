import { Selectable } from 'kysely';
import { SharedLinkType } from 'src/enum';
import { SharedLinkTable } from 'src/schema/tables/shared-link.table';
import { AlbumFactory } from 'test/factories/album.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { build } from 'test/factories/builder.factory';
import { AlbumLike, AssetLike, FactoryBuilder, SharedLinkLike, UserLike } from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { factory, newDate, newUuid } from 'test/small.factory';

export class SharedLinkFactory {
  #owner: UserFactory;
  #album?: AlbumFactory;
  #assets: AssetFactory[] = [];

  private constructor(private readonly value: Selectable<SharedLinkTable>) {
    value.userId ??= newUuid();
    this.#owner = UserFactory.from({ id: value.userId });
  }

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
    });
  }

  owner(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory>): SharedLinkFactory {
    this.#owner = build(UserFactory.from(dto), builder);
    return this;
  }

  album(dto: AlbumLike = {}, builder?: FactoryBuilder<AlbumFactory>) {
    this.#album = build(AlbumFactory.from(dto), builder);
    return this;
  }

  asset(dto: AssetLike = {}, builder?: FactoryBuilder<AssetFactory>) {
    const asset = build(AssetFactory.from(dto), builder);
    this.#assets.push(asset);
    return this;
  }

  build() {
    return {
      ...this.value,
      owner: this.#owner.build(),
      album: this.#album?.build() ?? null,
      assets: this.#assets.map((asset) => asset.build()),
    };
  }
}
