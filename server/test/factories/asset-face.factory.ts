import { Selectable } from 'kysely';
import { SourceType } from 'src/enum.js';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table.js';
import { build } from 'test/factories/builder.factory.js';
import { PersonFactory } from 'test/factories/person.factory.js';
import { AssetFaceLike, FactoryBuilder, PersonLike } from 'test/factories/types.js';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory.js';

export class AssetFaceFactory {
  #person: PersonFactory | null = null;

  private constructor(private readonly value: Selectable<AssetFaceTable>) {}

  static create(dto: AssetFaceLike = {}) {
    return AssetFaceFactory.from(dto).build();
  }

  static from(dto: AssetFaceLike = {}) {
    return new AssetFaceFactory({
      assetId: newUuid(),
      boundingBoxX1: 100,
      boundingBoxX2: 200,
      boundingBoxY1: 100,
      boundingBoxY2: 200,
      deletedAt: null,
      id: newUuid(),
      imageHeight: 500,
      imageWidth: 400,
      isVisible: true,
      personGroupId: null,
      sourceType: SourceType.MachineLearning,
      updatedAt: newDate(),
      updateId: newUuidV7(),
      ...dto,
    });
  }

  person(dto: PersonLike = {}, builder?: FactoryBuilder<PersonFactory>) {
    this.#person = build(PersonFactory.from(dto), builder);
    this.value.personGroupId = this.#person.build().personGroupId;
    return this;
  }

  build() {
    return { ...this.value, person: this.#person?.build() ?? null };
  }
}
