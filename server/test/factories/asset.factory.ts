import { Selectable } from 'kysely';
import { isUndefined, omitBy } from 'lodash';
import { AssetFileType, AssetStatus, AssetType, AssetVisibility } from 'src/enum';
import { AssetTable } from 'src/schema/tables/asset.table';
import { AssetEditFactory } from 'test/factories/asset-edit.factory';
import { AssetExifFactory } from 'test/factories/asset-exif.factory';
import { AssetFileFactory } from 'test/factories/asset-file.factory';
import { build } from 'test/factories/builder.factory';
import {
  AssetEditLike,
  AssetExifLike,
  AssetFaceStub,
  AssetFileLike,
  AssetLike,
  AssetStub,
  FactoryBuilder,
  RelationKeysPath,
  UserLike,
} from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { newDate, newSha1, newUuid, newUuidV7 } from 'test/small.factory';

export class AssetFactory<T extends RelationKeysPath<'asset'> = never> {
  #assetExif?: AssetExifFactory;
  #owner?: UserFactory;
  #files?: AssetFileFactory[];
  #edits?: AssetEditFactory[];
  #faces?: AssetFaceStub[];

  private constructor(private readonly value: Selectable<AssetTable>) {}

  static create(dto: AssetLike = {}) {
    return AssetFactory.from(dto).build();
  }

  static from(dto: AssetLike = {}) {
    const id = dto.id ?? newUuid();

    const originalFileName = dto.originalFileName ?? `IMG_${id}.jpg`;

    return new AssetFactory({
      id,
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
      originalFileName,
      originalPath: `/data/library/${originalFileName}`,
      ownerId: newUuid(),
      stackId: null,
      thumbhash: null,
      type: AssetType.Image,
      visibility: AssetVisibility.Timeline,
      width: null,
      height: null,
      isEdited: false,
      ...dto,
    })
      .owner()
      .files([])
      .edits()
      .faces();
  }

  owner(dto: UserLike = {}, builder?: FactoryBuilder<UserFactory>) {
    this.#owner = build(UserFactory.from(dto), builder);
    this.value.ownerId = this.#owner.build().id;
    return this as AssetFactory<T | 'owner'>;
  }

  exif(dto: AssetExifLike = {}, builder?: FactoryBuilder<AssetExifFactory>) {
    this.#assetExif = build(AssetExifFactory.from(dto), builder);
    return this as AssetFactory<T | 'exifInfo'>;
  }

  edit(dto: AssetEditLike = {}, builder?: FactoryBuilder<AssetEditFactory>) {
    if (!this.#edits) {
      this.#edits = [];
    }
    this.#edits.push(build(AssetEditFactory.from(dto).asset(this.value), builder));
    this.value.isEdited = true;
    return this as AssetFactory<T | 'edits'>;
  }

  edits(dto: AssetEditLike[] = [], builder?: FactoryBuilder<AssetEditFactory>) {
    if (!this.#edits) {
      this.#edits = [];
    }
    this.#edits.push(...dto.map((assetEdit) => build(AssetEditFactory.from(assetEdit).asset(this.value), builder)));
    this.value.isEdited = true;
    return this as AssetFactory<T | 'edits'>;
  }

  file(dto: AssetFileLike = {}, builder?: FactoryBuilder<AssetFileFactory>) {
    if (!this.#files) {
      this.#files = [];
    }
    this.#files.push(build(AssetFileFactory.from(dto).asset(this.value), builder));
    return this as AssetFactory<T | 'files'>;
  }

  files(dto?: 'edits'): AssetFactory<T | 'files'>;
  files(items: AssetFileLike[], builder?: FactoryBuilder<AssetFileFactory>): AssetFactory<T | 'files'>;
  files(items: AssetFileType[], builder?: FactoryBuilder<AssetFileFactory>): AssetFactory<T | 'files'>;
  files(dto?: 'edits' | AssetFileLike[] | AssetFileType[], builder?: FactoryBuilder<AssetFileFactory>) {
    const items: AssetFileLike[] = [];

    if (!this.#files) {
      this.#files = [];
    }

    if (dto === undefined || dto === 'edits') {
      items.push(...Object.values(AssetFileType).map((type) => ({ type })));

      if (dto === 'edits') {
        items.push(...Object.values(AssetFileType).map((type) => ({ type, isEdited: true })));
      }
    } else {
      for (const item of dto) {
        items.push(typeof item === 'string' ? { type: item as AssetFileType } : item);
      }
    }
    for (const item of items) {
      this.file(item, builder);
    }

    return this as AssetFactory<T | 'files'>;
  }

  faces() {
    this.#faces = [];
    return this as AssetFactory<T | 'faces'>;
  }

  build() {
    const exif = this.#assetExif?.build();

    return omitBy(
      {
        ...this.value,
        owner: this.#owner?.build(),
        exifInfo: exif as NonNullable<typeof exif>,
        files: this.#files?.map((file) => file.build()),
        edits: this.#edits?.map((edit) => edit.build()),
        faces: this.#faces,
      },
      isUndefined,
    ) as AssetStub<T>;
  }
}
