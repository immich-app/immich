import { Selectable } from 'kysely';
import { PersonTable } from 'src/schema/tables/person.table';
import { build } from 'test/factories/builder.factory';
import { FaceClusterFactory } from 'test/factories/face-cluster.factory';
import { FaceClusterLike, FactoryBuilder, PersonLike } from 'test/factories/types';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class PersonFactory {
  #faceCluster!: FaceClusterFactory;

  private constructor(private readonly value: Selectable<PersonTable>) {}

  static create(dto: PersonLike = {}) {
    return PersonFactory.from(dto).build();
  }

  static from(dto: PersonLike = {}) {
    const faceClusterId = dto.faceClusterId ?? newUuid();
    return new PersonFactory({
      createdAt: newDate(),
      id: newUuid(),
      isFavorite: false,
      isHidden: false,
      ownerId: newUuid(),
      thumbnailPath: '/data/thumbs/person-thumbnail.jpg',
      updatedAt: newDate(),
      updateId: newUuidV7(),
      faceClusterId,
      ...dto,
    }).faceCluster({ id: faceClusterId });
  }

  faceCluster(dto: FaceClusterLike = {}, builder?: FactoryBuilder<FaceClusterFactory>) {
    this.#faceCluster = build(FaceClusterFactory.from(dto), builder);
    this.value.faceClusterId = this.#faceCluster.build().id;
    return this;
  }

  build() {
    return { ...this.value, faceCluster: this.#faceCluster.build() };
  }
}
