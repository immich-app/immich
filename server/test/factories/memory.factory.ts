import { Selectable } from 'kysely';
import { MemoryType } from 'src/enum';
import { MemoryTable } from 'src/schema/tables/memory.table';
import { AssetFactory } from 'test/factories/asset.factory';
import { build } from 'test/factories/builder.factory';
import { AssetLike, FactoryBuilder, MemoryLike } from 'test/factories/types';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

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
