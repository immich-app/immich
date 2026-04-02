import { Selectable } from 'kysely';
import { AssetFileType } from 'src/enum';
import { AssetFileTable } from 'src/schema/tables/asset-file.table';
import { AssetFactory } from 'test/factories/asset.factory';
import { build } from 'test/factories/builder.factory';
import { AssetFileLike, AssetLike, FactoryBuilder } from 'test/factories/types';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class AssetFileFactory {
  private constructor(private readonly value: Selectable<AssetFileTable>) {}

  static create(dto: AssetFileLike = {}) {
    return AssetFileFactory.from(dto).build();
  }

  static from(dto: AssetFileLike = {}) {
    const id = dto.id ?? newUuid();
    const isEdited = dto.isEdited ?? false;

    return new AssetFileFactory({
      id,
      assetId: newUuid(),
      createdAt: newDate(),
      updatedAt: newDate(),
      type: AssetFileType.Thumbnail,
      path: `/data/12/34/thumbs/${id.slice(0, 2)}/${id.slice(2, 4)}/${id}${isEdited ? '_edited' : ''}.jpg`,
      updateId: newUuidV7(),
      isProgressive: false,
      isTransparent: false,
      isEdited,
      ...dto,
    });
  }

  asset(dto: AssetLike = {}, builder?: FactoryBuilder<AssetFactory>) {
    const asset = build(AssetFactory.from(dto), builder);
    this.value.assetId = asset.build().id;
    return this;
  }

  build() {
    return { ...this.value };
  }
}
