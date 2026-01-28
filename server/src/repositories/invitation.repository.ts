import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { DateTime } from 'luxon';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { InvitationTable } from 'src/schema/tables/invitation.table';
import { asUuid } from 'src/utils/database';

@Injectable()
export class InvitationRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string) {
    return this.db
      .selectFrom('invitation')
      .selectAll()
      .where('id', '=', asUuid(id))
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByToken(token: string) {
    return this.db
      .selectFrom('invitation')
      .selectAll()
      .where('token', '=', token)
      .where('acceptedAt', 'is', null)
      .where('expiresAt', '>', DateTime.now().toJSDate())
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByEmail(email: string) {
    return this.db
      .selectFrom('invitation')
      .selectAll()
      .where('email', '=', email.toLowerCase())
      .where('acceptedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getPendingByInviter(invitedById: string) {
    return this.db
      .selectFrom('invitation')
      .selectAll()
      .where('invitedById', '=', asUuid(invitedById))
      .where('acceptedAt', 'is', null)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  create(dto: Insertable<InvitationTable>) {
    return this.db
      .insertInto('invitation')
      .values({ ...dto, email: dto.email.toLowerCase() })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  update(id: string, dto: Updateable<InvitationTable>) {
    return this.db
      .updateTable('invitation')
      .set(dto)
      .where('id', '=', asUuid(id))
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string) {
    await this.db.deleteFrom('invitation').where('id', '=', asUuid(id)).execute();
  }

  async cleanupExpired() {
    return this.db
      .deleteFrom('invitation')
      .where('expiresAt', '<=', DateTime.now().toJSDate())
      .where('acceptedAt', 'is', null)
      .returning(['id', 'email'])
      .execute();
  }
}
