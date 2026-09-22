import { Selectable } from 'kysely';
import { PersonGroupTable } from 'src/schema/tables/person-group.table.js';
import { PersonGroupLike } from 'test/factories/types.js';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory.js';

export class PersonGroupFactory {
  private constructor(private readonly value: Selectable<PersonGroupTable>) {}

  static create(dto: PersonGroupLike = {}) {
    return PersonGroupFactory.from(dto).build();
  }

  static from(dto: PersonGroupLike = {}) {
    return new PersonGroupFactory({
      id: newUuid(),
      clusterGroupId: newUuid(),
      createdAt: newDate(),
      createId: newUuidV7(),
      updatedAt: newDate(),
      updateId: newUuidV7(),
      ...dto,
    });
  }

  build() {
    return { ...this.value };
  }
}
