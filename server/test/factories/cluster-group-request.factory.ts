import { Selectable } from 'kysely';
import { ClusterGroupRequestTable } from 'src/schema/tables/cluster-group-request.table.js';
import { ClusterGroupRequestLike } from 'test/factories/types.js';
import { newDate, newUuid } from 'test/small.factory.js';

export class ClusterGroupRequestFactory {
  private constructor(private readonly value: Selectable<ClusterGroupRequestTable>) {}

  static create(dto: ClusterGroupRequestLike = {}) {
    return ClusterGroupRequestFactory.from(dto).build();
  }

  static from(dto: ClusterGroupRequestLike = {}) {
    return new ClusterGroupRequestFactory({
      id: newUuid(),
      clusterGroupId: newUuid(),
      userId: newUuid(),
      createdAt: newDate(),
      ...dto,
    });
  }

  build() {
    return { ...this.value };
  }
}
