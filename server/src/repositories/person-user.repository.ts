import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { PersonUserDeleteRequestDto, PersonUserRole } from 'src/dtos/person.dto.js';
import { DB } from 'src/schema/index.js';
import { PersonUserTable } from 'src/schema/tables/person-user.table.js';

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
    await this.db
      .deleteFrom('person_user')
      .where('person_user.sharedById', '=', sharedById)
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom(eb.fn<{ personId: string; sharedWithId: string }>('unnest', [eb.val(dto)]).as('people'))
            .selectAll()
            .whereRef('people.personId', '=', 'person_user.personGroupId')
            .whereRef('people.sharedWithId', '=', 'person_user.sharedWithId'),
        ),
      )
      .execute();
  }
}
