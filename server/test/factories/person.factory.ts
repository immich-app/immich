import { Selectable } from 'kysely';
import { PersonTable } from 'src/schema/tables/person.table';
import { PersonLike } from 'test/factories/types';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class PersonFactory {
  private constructor(private readonly value: Selectable<PersonTable>) {}

  static create(dto: PersonLike = {}) {
    return PersonFactory.from(dto).build();
  }

  static from(dto: PersonLike = {}) {
    return new PersonFactory({
      birthDate: null,
      color: null,
      createdAt: newDate(),
      faceAssetId: null,
      id: newUuid(),
      isFavorite: false,
      isHidden: false,
      name: 'person',
      ownerId: newUuid(),
      thumbnailPath: '/data/thumbs/person-thumbnail.jpg',
      updatedAt: newDate(),
      updateId: newUuidV7(),
      ...dto,
    });
  }

  build() {
    return { ...this.value };
  }
}
