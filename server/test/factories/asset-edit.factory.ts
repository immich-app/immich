import { Selectable } from 'kysely';
import { AssetEditAction, AssetEditActionItem } from 'src/dtos/editing.dto';
import { AssetEditTable } from 'src/schema/tables/asset-edit.table';
import { AssetFactory } from 'test/factories/asset.factory';
import { build } from 'test/factories/builder.factory';
import { AssetEditLike, AssetLike, FactoryBuilder } from 'test/factories/types';
import { newUuid } from 'test/small.factory';

export class AssetEditFactory {
  private constructor(private readonly value: Selectable<AssetEditTable>) {}

  static create(dto: AssetEditLike = {}) {
    return AssetEditFactory.from(dto).build();
  }

  static from(dto: AssetEditLike = {}) {
    const id = dto.id ?? newUuid();

    return new AssetEditFactory({
      id,
      assetId: newUuid(),
      action: AssetEditAction.Crop,
      parameters: { x: 5, y: 6, width: 200, height: 100 },
      sequence: 1,
      ...dto,
    });
  }

  asset(dto: AssetLike = {}, builder?: FactoryBuilder<AssetFactory>) {
    const asset = build(AssetFactory.from(dto), builder);
    this.value.assetId = asset.build().id;
    return this;
  }

  build() {
    return { ...this.value } as Omit<Selectable<AssetEditTable>, 'action' | 'parameters'> & AssetEditActionItem;
  }
}
