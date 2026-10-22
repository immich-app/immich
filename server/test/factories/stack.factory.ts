import { Selectable } from 'kysely';
import { StackTable } from 'src/schema/tables/stack.table.js';
import { AssetFactory } from 'test/factories/asset.factory.js';
import { build } from 'test/factories/builder.factory.js';
import { AssetLike, FactoryBuilder, StackLike } from 'test/factories/types.js';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory.js';

export class StackFactory {
  #assets: AssetFactory[] = [];
  #primaryAsset: AssetFactory;

  private constructor(private readonly value: Selectable<StackTable>) {
    this.#primaryAsset = AssetFactory.from();
    this.value.primaryAssetId = this.#primaryAsset.build().id;
  }

  static create(dto: StackLike = {}) {
    return StackFactory.from(dto).build();
  }

  static from(dto: StackLike = {}) {
    return new StackFactory({
      createdAt: newDate(),
      id: newUuid(),
      ownerId: newUuid(),
      primaryAssetId: newUuid(),
      updatedAt: newDate(),
      updateId: newUuidV7(),
      ...dto,
    });
  }

  asset(dto: AssetLike = {}, builder?: FactoryBuilder<AssetFactory>) {
    this.#assets.push(build(AssetFactory.from(dto), builder));
    return this;
  }

  primaryAsset(dto: AssetLike = {}, builder?: FactoryBuilder<AssetFactory>) {
    this.#primaryAsset = build(AssetFactory.from(dto), builder);
    this.value.primaryAssetId = this.#primaryAsset.build().id;
    this.#assets.push(this.#primaryAsset);
    return this;
  }

  build() {
    return {
      ...this.value,
      assets: this.#assets.map((asset) => asset.build()),
      primaryAsset: this.#primaryAsset.build(),
    };
  }
}
