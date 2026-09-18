import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { PersonUserDeleteRequestDto, PersonUserRole } from 'src/dtos/person.dto.js';
import { DB } from 'src/schema/index.js';
import { PersonUserTable } from 'src/schema/tables/person-user.table.js';
import { withSharedPeople } from 'src/utils/database.js';

@Injectable()
export class PersonUserRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getForOwner(ownerId: string) {
    return this.db
      .selectFrom('person_user')
      .select([
        'person_user.personGroupId as personId',
        'person_user.sharedById',
        'person_user.sharedWithId',
        'person_user.role',
      ])
      .select((eb) =>
        jsonObjectFrom(eb.selectFrom('user').selectAll().whereRef('user.id', '=', 'person_user.sharedWithId'))
          .$notNull()
          .as('sharedWith'),
      )
      .where('person_user.sharedById', '=', ownerId)
      .execute();
  }

  @GenerateSql({
    params: [
      {
        personGroupId: DummyValue.UUID,
        sharedById: DummyValue.UUID,
        sharedWithId: DummyValue.UUID,
        role: PersonUserRole.Admin,
      },
    ],
  })
  createAll(dto: Insertable<PersonUserTable>[]) {
    return this.db
      .insertInto('person_user')
      .values(dto)
      .onConflict((oc) =>
        oc
          .columns(['personGroupId', 'sharedById', 'sharedWithId'])
          .doUpdateSet((eb) => ({ role: eb.ref('excluded.role') })),
      )
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [{ personId: DummyValue.UUID, sharedWithId: DummyValue.UUID }]] })
  async deleteAll(sharedById: string, dto: PersonUserDeleteRequestDto) {
    if (dto.length === 0) {
      return;
    }

    const personIds = dto.map(({ personId, sharedWithId }) => ({ personGroupId: personId, ownerId: sharedWithId }));

    await this.db
      .deleteFrom('person_user')
      .$call(withSharedPeople(personIds))
      .where('person_user.sharedById', '=', sharedById)
      .execute();
  }
}
