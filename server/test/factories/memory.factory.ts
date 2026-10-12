import { Selectable } from 'kysely';
import { MemoryType } from 'src/enum.js';
import { MemoryTable } from 'src/schema/tables/memory.table.js';
import { AssetFactory } from 'test/factories/asset.factory.js';
import { build } from 'test/factories/builder.factory.js';
import { AssetLike, FactoryBuilder, MemoryLike } from 'test/factories/types.js';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory.js';

export class MemoryFactory {
  #assets: AssetFactory[] = [];

  private constructor(private readonly value: Selectable<MemoryTable>) {}

  static create(dto: MemoryLike = {}) {
    return MemoryFactory.from(dto).build();
  }

  static from(dto: MemoryLike = {}) {
    return new MemoryFactory({
      id: newUuid(),
      createdAt: newDate(),
      updatedAt: newDate(),
      updateId: newUuidV7(),
      deletedAt: null,
      ownerId: newUuid(),
      type: MemoryType.OnThisDay,
      data: { year: 2024 },
      isSaved: false,
      memoryAt: newDate(),
      seenAt: null,
      showAt: newDate(),
      hideAt: newDate(),
      ...dto,
    });
  }

  asset(asset: AssetLike, builder?: FactoryBuilder<AssetFactory>) {
    this.#assets.push(build(AssetFactory.from(asset), builder));
    return this;
  }

  build() {
    return { ...this.value, assets: this.#assets.map((asset) => asset.build()) };
  }
}
