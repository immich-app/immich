import { Selectable } from 'kysely';
import { SourceType } from 'src/enum';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { build } from 'test/factories/builder.factory';
import { PersonFactory } from 'test/factories/person.factory';
import { AssetFaceLike, FactoryBuilder, PersonLike } from 'test/factories/types';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class AssetFaceFactory {
  #person: PersonFactory | null = null;

  private constructor(private readonly value: Selectable<AssetFaceTable>) {}

  static create(dto: AssetFaceLike = {}) {
    return AssetFaceFactory.from(dto).build();
  }

  static from(dto: AssetFaceLike = {}) {
    return new AssetFaceFactory({
      assetId: newUuid(),
      boundingBoxX1: 11,
      boundingBoxX2: 12,
      boundingBoxY1: 21,
      boundingBoxY2: 22,
      deletedAt: null,
      id: newUuid(),
      imageHeight: 42,
      imageWidth: 420,
      isVisible: true,
      personId: null,
      sourceType: SourceType.MachineLearning,
      updatedAt: newDate(),
      updateId: newUuidV7(),
      ...dto,
    });
  }

  person(dto: PersonLike = {}, builder?: FactoryBuilder<PersonFactory>) {
    this.#person = build(PersonFactory.from(dto), builder);
    this.value.personId = this.#person.build().id;
    return this;
  }

  build() {
    return { ...this.value, person: this.#person?.build() ?? null };
  }
}
