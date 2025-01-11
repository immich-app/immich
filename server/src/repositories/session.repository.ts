import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB, Sessions } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { SessionEntity, withUser } from 'src/entities/session.entity';
import { ISessionRepository, SessionSearchOptions } from 'src/interfaces/session.interface';
import { asUuid } from 'src/utils/database';
import { Repository } from 'typeorm';

@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(
    @InjectRepository(SessionEntity) private repository: Repository<SessionEntity>,
    @InjectKysely() private db: Kysely<DB>,
  ) {}

  @GenerateSql({ params: [{ updatedBefore: DummyValue.DATE }] })
  search(options: SessionSearchOptions): Promise<SessionEntity[]> {
    return this.db
      .selectFrom('sessions')
      .selectAll()
      .where('sessions.updatedAt', '<=', options.updatedBefore)
      .execute() as Promise<SessionEntity[]>;
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByToken(token: string): Promise<SessionEntity | null> {
    return this.db
      .selectFrom('sessions')
      .innerJoinLateral(withUser, (join) => join.onTrue())
      .selectAll('sessions')
      .select((eb) => eb.fn.toJson('user').as('user'))
      .where('sessions.token', '=', token)
      .executeTakeFirst() as unknown as Promise<SessionEntity | null>;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByUserId(userId: string): Promise<SessionEntity[]> {
    return this.db
      .selectFrom('sessions')
      .innerJoinLateral(withUser, (join) => join.onTrue())
      .selectAll('sessions')
      .select((eb) => eb.fn.toJson('user').as('user'))
      .where('sessions.userId', '=', userId)
      .orderBy('sessions.updatedAt', 'desc')
      .orderBy('sessions.createdAt', 'desc')
      .execute() as any as Promise<SessionEntity[]>;
  }

  create(dto: Insertable<Sessions>): Promise<SessionEntity> {
    return this.db.insertInto('sessions').values(dto).returningAll().executeTakeFirst() as Promise<SessionEntity>;
  }

  update(dto: Updateable<Sessions>): Promise<SessionEntity> {
    return this.db.updateTable('sessions').set(dto).returningAll().executeTakeFirst() as Promise<SessionEntity>;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('sessions').where('id', '=', asUuid(id)).execute();
  }
}
