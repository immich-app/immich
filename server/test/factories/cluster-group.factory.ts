import { Selectable } from 'kysely';
import { ClusterGroupTable } from 'src/schema/tables/cluster-group.table.js';
import { ClusterGroupLike } from 'test/factories/types.js';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory.js';

export class ClusterGroupFactory {
  private constructor(private readonly value: Selectable<ClusterGroupTable>) {}

  static create(dto: ClusterGroupLike = {}) {
    return ClusterGroupFactory.from(dto).build();
  }

  static from(dto: ClusterGroupLike = {}) {
    return new ClusterGroupFactory({
      id: newUuid(),
      name: null,
      createdAt: newDate(),
      updatedAt: newDate(),
      updateId: newUuidV7(),
      ...dto,
    });
  }

  build() {
    return { ...this.value };
  }
}
