import { Selectable } from 'kysely';
import { AssetFileType, AssetStatus, AssetType, AssetVisibility } from 'src/enum';
import { AssetTable } from 'src/schema/tables/asset.table';
import { StackTable } from 'src/schema/tables/stack.table';
import { AssetEditFactory } from 'test/factories/asset-edit.factory';
import { AssetExifFactory } from 'test/factories/asset-exif.factory';
import { AssetFaceFactory } from 'test/factories/asset-face.factory';
import { AssetFileFactory } from 'test/factories/asset-file.factory';
import { build } from 'test/factories/builder.factory';
import { StackFactory } from 'test/factories/stack.factory';
import {
  AssetEditLike,
  AssetExifLike,
  AssetFaceLike,
  AssetFileLike,
  AssetLike,
  FactoryBuilder,
  StackLike,
  UserLike,
} from 'test/factories/types';
import { UserFactory } from 'test/factories/user.factory';
import { newDate, newSha1, newUuid, newUuidV7 } from 'test/small.factory';

export class AssetFactory {
  #owner!: UserFactory;
  #assetExif?: AssetExifFactory;
  #files: AssetFileFactory[] = [];
  #edits: AssetEditFactory[] = [];
  #faces: AssetFaceFactory[] = [];
  #stack?: Selectable<StackTable> & { assets: Selectable<AssetTable>[]; primaryAsset: Selectable<AssetTable> };

  private constructor(private readonly value: Selectable<AssetTable>) {
    value.ownerId ??= newUuid();
    this.#owner = UserFactory.from({ id: value.ownerId });
  }

  static create(dto: AssetLike = {}) {
    return AssetFactory.from(dto).build();
  }

  static from(dto: AssetLike = {}) {
    const id = dto.id ?? newUuid();

    const originalFileName = dto.originalFileName ?? (dto.type === AssetType.Video ? `MOV_${id}.mp4` : `IMG_${id}.jpg`);

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

  edit(dto: AssetEditLike = {}, builder?: FactoryBuilder<AssetEditFactory>) {
    this.#edits.push(build(AssetEditFactory.from(dto).asset(this.value), builder));
    this.value.isEdited = true;
    return this;
  }

  face(dto: AssetFaceLike = {}, builder?: FactoryBuilder<AssetFaceFactory>) {
    this.#faces.push(build(AssetFaceFactory.from(dto), builder));
    return this;
  }

  file(dto: AssetFileLike = {}, builder?: FactoryBuilder<AssetFileFactory>) {
    this.#files.push(build(AssetFileFactory.from(dto).asset(this.value), builder));
    return this;
  }

  files(dto?: 'edits'): AssetFactory;
  files(items: AssetFileLike[], builder?: FactoryBuilder<AssetFileFactory>): AssetFactory;
  files(items: AssetFileType[], builder?: FactoryBuilder<AssetFileFactory>): AssetFactory;
  files(dto?: 'edits' | AssetFileLike[] | AssetFileType[], builder?: FactoryBuilder<AssetFileFactory>): AssetFactory {
    const items: AssetFileLike[] = [];

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

    return this;
  }

  stack(dto: StackLike = {}, builder?: FactoryBuilder<StackFactory>) {
    this.#stack = build(StackFactory.from(dto).primaryAsset(this.value), builder).build();
    this.value.stackId = this.#stack.id;
    return this;
  }

  build() {
    const exif = this.#assetExif?.build();

    return {
      ...this.value,
      owner: this.#owner.build(),
      exifInfo: exif as NonNullable<typeof exif>,
      files: this.#files.map((file) => file.build()),
      edits: this.#edits.map((edit) => edit.build()),
      faces: this.#faces.map((face) => face.build()),
      stack: this.#stack ?? null,
      tags: [],
    };
  }
}
