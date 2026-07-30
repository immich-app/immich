import { Selectable } from 'kysely';
import { PersonTable } from 'src/schema/tables/person.table';
import { build } from 'test/factories/builder.factory';
import { PersonUserFactory } from 'test/factories/person-user.factory';
import { FactoryBuilder, PersonLike, PersonUserLike } from 'test/factories/types';
import { newDate, newUuid, newUuidV7 } from 'test/small.factory';

export class PersonFactory {
  #personUser!: PersonUserFactory;

  private constructor(private readonly value: Selectable<PersonTable>) {}

  static create(dto: PersonLike = {}) {
    return PersonFactory.from(dto).build();
  }

  static from(dto: PersonLike = {}) {
    return new PersonFactory({
      birthDate: null,
      color: null,
      createdAt: newDate(),
      id: newUuid(),
      name: 'person',
      updatedAt: newDate(),
      updateId: newUuidV7(),
      trustedGroupId: newUuid(),
      ...dto,
    }).personUser();
  }

  personUser(dto: PersonUserLike = {}, builder?: FactoryBuilder<PersonUserFactory>) {
    this.#personUser = build(PersonUserFactory.from({ ...dto, personId: this.value.id }), builder);
    return this;
  }

  build() {
    return { ...this.value, personUser: this.#personUser.build() };
  }
}
