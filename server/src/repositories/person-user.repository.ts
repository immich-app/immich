import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database.js';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { PersonUserRole, PersonUsersDeleteDto, PersonUsersSearchDto } from 'src/dtos/person.dto.js';
import { SharingDirection } from 'src/enum.js';
import { DB } from 'src/schema/index.js';
import { PersonUserTable } from 'src/schema/tables/person-user.table.js';

@Injectable()
export class PersonUserRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, {}] })
  searchPeopleUsers(ownerId: string, dto: PersonUsersSearchDto) {
    return this.db
      .selectFrom('person_user')
      .select([
        'person_user.personGroupId as personId',
        'person_user.sharedById',
        'person_user.sharedWithId',
        'person_user.role',
      ])
      .select((eb) => [
        jsonObjectFrom(
          eb.selectFrom('user').select(columns.userPrefix).whereRef('user.id', '=', 'person_user.sharedById'),
        )
          .$notNull()
          .as('sharedBy'),
        jsonObjectFrom(
          eb.selectFrom('user').select(columns.userPrefix).whereRef('user.id', '=', 'person_user.sharedWithId'),
        )
          .$notNull()
          .as('sharedWith'),
      ])
      .$if(!!dto.personId, (qb) => qb.where('person_user.personGroupId', '=', dto.personId!))
      .$if(!!dto.sharedWithId, (qb) => qb.where('person_user.sharedWithId', '=', dto.sharedWithId!))
      .$if(!!dto.sharedById, (qb) => qb.where('person_user.sharedById', '=', dto.sharedById!))
      .$if(!!dto.role, (qb) => qb.where('person_user.role', '=', dto.role!))
      .$if(dto.direction === undefined, (qb) =>
        qb.where((eb) =>
          eb.or([eb('person_user.sharedById', '=', ownerId), eb('person_user.sharedWithId', '=', ownerId)]),
        ),
      )
      .$if(dto.direction !== undefined, (qb) =>
        qb.where(
          dto.direction === SharingDirection.SharedBy ? 'person_user.sharedById' : 'person_user.sharedWithId',
          '=',
          ownerId,
        ),
      )
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
    if (dto.length === 0) {
      return [];
    }

    return this.db
      .insertInto('person_user')
      .values(dto)
      .onConflict((oc) =>
        oc
          .columns(['personGroupId', 'sharedById', 'sharedWithId'])
          .doUpdateSet((eb) => ({ role: eb.ref('excluded.role') })),
      )
      .returningAll()
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [{ personId: DummyValue.UUID, sharedWithId: DummyValue.UUID }]] })
  async deleteAll(sharedById: string, dto: PersonUsersDeleteDto) {
    if (dto.length === 0) {
      return;
    }

    const personGroupIds = dto.map(({ personId }) => personId);
    const sharedWithIds = dto.map(({ sharedWithId }) => sharedWithId);
    const people = sql<{ personGroupId: string; sharedWithId: string }>`(
      select
        unnest(${personGroupIds}::uuid[]) as "personGroupId",
        unnest(${sharedWithIds}::uuid[]) as "sharedWithId"
    )`.as('people');

    await this.db
      .deleteFrom('person_user')
      .where(({ exists, selectFrom }) =>
        exists(
          selectFrom(people)
            .whereRef('people.personGroupId', '=', 'person_user.personGroupId')
            .whereRef('people.sharedWithId', '=', 'person_user.sharedWithId')
            .selectAll(),
        ),
      )
      .where('person_user.sharedById', '=', sharedById)
      .execute();
  }
}
