import { PersonLike, PersonRow } from 'test/factories/types.js';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory.js';

export class PersonFactory {
  private constructor(private readonly value: PersonRow) {}

  static create(dto: PersonLike = {}) {
    return PersonFactory.from(dto).build();
  }

  static from(dto: PersonLike = {}) {
    return new PersonFactory({
      birthDate: null,
      color: null,
      createdAt: newDate(),
      faceAssetId: null,
      personGroupId: newUuid(),
      isFavorite: false,
      isHidden: false,
      name: 'person',
      otherPeople: [],
      sharedBy: [],
      sharedWith: [],
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
