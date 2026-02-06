import { Selectable } from 'kysely';
import { AssetStatus, AssetType, AssetVisibility } from 'src/enum';
import { AssetTable } from 'src/schema/tables/asset.table';
import { AssetExifFactory } from 'test/factories/asset-exif.factory';
import { build } from 'test/factories/builder.factory';
import { AssetExifLike, AssetLike, FactoryBuilder, UserLike } from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { factory, newDate, newSha1, newUuid, newUuidV7 } from 'test/small.factory';

export class AssetFactory {
  #assetExif?: AssetExifFactory;
  #owner!: UserFactory;

  private constructor(private readonly value: Selectable<AssetTable>) {
    value.ownerId ??= newUuid();
    this.#owner = UserFactory.from({ id: value.ownerId });
  }

  static create(dto: AssetLike = {}) {
    return AssetFactory.from(dto).build();
  }

  static from(dto: AssetLike = {}) {
    return new AssetFactory({
      id: factory.uuid(),
      createdAt: newDate(),
      updatedAt: newDate(),
      deletedAt: null,
      updateId: newUuidV7(),
      status: AssetStatus.Active,
      checksum: newSha1(),
      deviceAssetId: '',
      deviceId: '',
      duplicateId: null,
      duration: null,
      encodedVideoPath: null,
      fileCreatedAt: newDate(),
      fileModifiedAt: newDate(),
      isExternal: false,
      isFavorite: false,
      isOffline: false,
      libraryId: null,
      livePhotoVideoId: null,
      localDateTime: newDate(),
      originalFileName: 'IMG_123.jpg',
      originalPath: `/data/12/34/IMG_123.jpg`,
      ownerId: newUuid(),
      stackId: null,
      thumbhash: null,
      type: AssetType.Image,
      visibility: AssetVisibility.Timeline,
      width: null,
      height: null,
      isEdited: false,
      ...dto,
    });
  }

  owner(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory>) {
    this.#owner = build(UserFactory.from(dto), builder);
    this.value.ownerId = this.#owner.build().id;
    return this;
  }

  exif(dto: AssetExifLike = {}, builder?: FactoryBuilder<AssetExifFactory>) {
    this.#assetExif = build(AssetExifFactory.from(dto), builder);
    return this;
  }

  build() {
    const exif = this.#assetExif?.build();

    return {
      ...this.value,
      exifInfo: exif as NonNullable<typeof exif>,
      owner: this.#owner.build(),
    };
  }
}
