import { Selectable } from 'kysely';
import { AlbumUserRole, AssetOrder } from 'src/enum';
import { AlbumTable } from 'src/schema/tables/album.table';
import { SharedLinkTable } from 'src/schema/tables/shared-link.table';
import { AlbumUserFactory } from 'test/factories/album-user.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { build } from 'test/factories/builder.factory';
import { AlbumLike, AlbumUserLike, AssetLike, FactoryBuilder, UserLike } from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class AlbumFactory {
  #owner!: UserFactory;
  #sharedLinks: Selectable<SharedLinkTable>[] = [];
  #albumUsers: AlbumUserFactory[] = [];
  #assets: AssetFactory[] = [];

  private constructor(private readonly value: Selectable<AlbumTable>) {}

  static create(dto: AlbumLike = {}) {
    return AlbumFactory.from(dto).build();
  }

  static from(dto: AlbumLike = {}) {
    return new AlbumFactory({
      id: newUuid(),
      albumName: 'My Album',
      albumThumbnailAssetId: null,
      createdAt: newDate(),
      deletedAt: null,
      description: 'Album description',
      isActivityEnabled: false,
      order: AssetOrder.Desc,
      updatedAt: newDate(),
      updateId: newUuidV7(),
      ...dto,
    }).owner();
  }

  owner(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory>) {
    this.#owner = build(UserFactory.from(dto), builder);
    this.albumUser({ userId: this.#owner.build().id, role: AlbumUserRole.Owner });
    return this;
  }

  sharedLinks() {
    this.#sharedLinks = [];
    return this;
  }

  albumUser(dto: AlbumUserLike = {}, builder?: FactoryBuilder<AlbumUserFactory>) {
    const albumUser = build(AlbumUserFactory.from(dto), builder);
    this.#albumUsers.push(albumUser);
    return this;
  }

  asset(dto: AssetLike = {}, builder?: FactoryBuilder<AssetFactory>) {
    const asset = build(AssetFactory.from(dto), builder);

    // use album owner by default
    if (!dto.ownerId) {
      asset.owner(this.#owner.build());
    }

    if (!this.#assets) {
      this.#assets = [];
    }

    this.#assets.push(asset);

    return this;
  }

  build() {
    return {
      ...this.value,
      assets: this.#assets.map((asset) => asset.build()),
      albumUsers: this.#albumUsers.map((albumUser) => albumUser.build()),
      sharedLinks: this.#sharedLinks,
    };
  }
}
