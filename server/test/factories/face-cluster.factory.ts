import { Selectable } from 'kysely';
import { FaceClusterTable } from 'src/schema/tables/face-cluster.table';
import { FaceClusterLike } from 'test/factories/types';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class FaceClusterFactory {
  private constructor(private readonly value: Selectable<FaceClusterTable>) {}

  static create(dto: FaceClusterLike = {}) {
    return FaceClusterFactory.from(dto).build();
  }

  static from(dto: FaceClusterLike = {}) {
    return new FaceClusterFactory({
      birthDate: null,
      createdAt: newDate(),
      featureFaceAssetId: null,
      id: newUuid(),
      name: 'person',
      updatedAt: newDate(),
      updateId: newUuidV7(),
      ...dto,
    });
  }

  build() {
    return { ...this.value };
  }
}
