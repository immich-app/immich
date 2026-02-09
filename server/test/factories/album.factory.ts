import { Selectable } from 'kysely';
import { isUndefined, omitBy } from 'lodash';
import { AssetOrder } from 'src/enum';
import { AlbumTable } from 'src/schema/tables/album.table';
import { SharedLinkTable } from 'src/schema/tables/shared-link.table';
import { AlbumUserFactory } from 'test/factories/album-user.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { build } from 'test/factories/builder.factory';
import {
  AlbumLike,
  AlbumStub,
  AlbumUserLike,
  AssetLike,
  FactoryBuilder,
  RelationKeysPath,
  UserLike,
} from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class AlbumFactory<T extends RelationKeysPath<'album'> = never> {
  #owner?: UserFactory;
  #sharedLinks?: Selectable<SharedLinkTable>[];
  #albumUsers?: AlbumUserFactory[];
  #assets?: AssetFactory[];

  private constructor(private readonly value: Selectable<AlbumTable>) {}

  static create(dto: AlbumLike = {}) {
    return AlbumFactory.from(dto).build();
  }

  static from(dto: AlbumLike = {}) {
    return new AlbumFactory({
      id: newUuid(),
      ownerId: newUuid(),
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
    })
      .owner()
      .sharedLinks()
      .albumUsers()
      .assets();
  }

  owner(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory<'metadata'>>) {
    this.#owner = build(UserFactory.from(dto), builder);
    this.value.ownerId = this.#owner.build().id;
    return this as AlbumFactory<T | 'owner' | 'owner.metadata'>;
  }

  sharedLinks() {
    this.#sharedLinks = [];
    return this as AlbumFactory<T | 'sharedLinks'>;
  }

  albumUser<K extends RelationKeysPath<'albumUser'> = never>(
    dto: AlbumUserLike = {},
    builder?: FactoryBuilder<AlbumUserFactory<'user'>, AlbumUserFactory<'user' | K>>,
  ) {
    const albumUser = build(AlbumUserFactory.from(dto), builder);

    if (!this.#albumUsers) {
      this.#albumUsers = [];
    }

    this.#albumUsers.push(albumUser);

    return this as AlbumFactory<
      T | 'albumUsers' | 'albumUsers.user' | 'albumUsers.user.metadata' | (K extends never ? never : `albumUsers.${K}`)
    >;
  }

  albumUsers<K extends RelationKeysPath<'albumUser'> = never>(
    dtos: AlbumUserLike[] = [],
    builder?: FactoryBuilder<AlbumUserFactory<'user'>, AlbumUserFactory<'user' | K>>,
  ) {
    const albumUsers = dtos.map((dto) => build(AlbumUserFactory.from(dto), builder));

    if (!this.#albumUsers) {
      this.#albumUsers = [];
    }

    this.#albumUsers.push(...albumUsers);

    return this as AlbumFactory<
      T | 'albumUsers' | 'albumUsers.user' | 'albumUsers.user.metadata' | (K extends never ? never : `albumUsers.${K}`)
    >;
  }

  asset<K extends RelationKeysPath<'asset'> = never>(
    dto: AssetLike = {},
    builder?: FactoryBuilder<AssetFactory<'owner'>, AssetFactory<'owner' | K>>,
  ) {
    const asset = build(AssetFactory.from(dto), builder);

    // use album owner by default
    if (!dto.ownerId) {
      asset.owner(this.#owner?.build());
    }

    if (!this.#assets) {
      this.#assets = [];
    }

    this.#assets.push(asset);

    return this as AlbumFactory<T | 'assets' | 'assets.owner' | (K extends never ? never : `assets.${K}`)>;
  }

  assets<K extends RelationKeysPath<'asset'> = never>(
    dtos: AssetLike[] = [],
    builder?: FactoryBuilder<AssetFactory<'owner' | 'exifInfo'>, AssetFactory<'owner' | 'exifInfo' | K>>,
  ) {
    const assets = dtos.map((dto) => {
      const asset = build(AssetFactory.from(dto), builder);
      if (dto.ownerId) {
        asset.owner(this.#owner?.build());
      }
      return asset;
    });

    if (!this.#assets) {
      this.#assets = [];
    }

    this.#assets.push(...assets);

    // TODO while assets.owner seems fair, assets.exifInfo is too much IMO
    return this as AlbumFactory<
      T | 'assets' | 'assets.owner' | 'assets.exifInfo' | (K extends never ? never : `assets.${K}`)
    >;
  }

  build() {
    return omitBy(
      {
        ...this.value,
        owner: this.#owner?.build(),
        assets: this.#assets?.map((asset) => asset.build()),
        albumUsers: this.#albumUsers?.map((albumUser) => albumUser.build()),
        sharedLinks: this.#sharedLinks,
      },
      isUndefined,
    ) as AlbumStub<T>;
  }
}
