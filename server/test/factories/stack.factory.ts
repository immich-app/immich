import { Selectable } from 'kysely';
import { StackTable } from 'src/schema/tables/stack.table';
import { AssetFactory } from 'test/factories/asset.factory';
import { build } from 'test/factories/builder.factory';
import { AssetLike, FactoryBuilder, StackLike } from 'test/factories/types';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

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
