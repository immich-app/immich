import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Kysely } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { SessionEntity } from 'src/entities/session.entity';
import { ISessionRepository, SessionSearchOptions } from 'src/interfaces/session.interface';
import { Repository } from 'typeorm';

@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(
    @InjectRepository(SessionEntity) private repository: Repository<SessionEntity>,
    @InjectKysely() private db: Kysely<DB>,
  ) {}

  @GenerateSql({ params: [{ updatedBefore: DummyValue.DATE }] })
  search(options: SessionSearchOptions): Promise<SessionEntity[]> {
    // return this.repository.find({ where: { updatedAt: LessThanOrEqual(options.updatedBefore) } });

    return this.db
      .selectFrom('sessions')
      .selectAll()
      .where('sessions.updatedAt', '<=', options.updatedBefore)
      .execute() as Promise<SessionEntity[]>;
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByToken(token: string): Promise<SessionEntity | null> {
    // return this.repository.findOne({
    //     where: { token },
    //     relations: {
    //       user: {
    //         metadata: true,
    //       },
    //     },
    //   });

    return this.db
      .selectFrom('sessions')
      .select((eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('users')
            .selectAll()
            .select((eb) =>
              eb
                .selectFrom('user_metadata')
                .whereRef('users.id', '=', 'user_metadata.userId')
                .select((eb) => eb.fn('array_agg', [eb.table('user_metadata')]).as('metadata'))
                .as('metadata'),
            )
            .whereRef('users.id', '=', 'sessions.userId')
            .where('users.deletedAt', 'is', null),
        ).as('user'),
      )
      .where('sessions.token', '=', token)
      .executeTakeFirst() as unknown as Promise<SessionEntity | null>;
  }

  getByUserId(userId: string): Promise<SessionEntity[]> {
    return this.repository.find({
      where: {
        userId,
      },
      relations: {
        user: true,
      },
      order: {
        updatedAt: 'desc',
        createdAt: 'desc',
      },
    });
  }

  create<T extends Partial<SessionEntity>>(dto: T): Promise<T & { id: string }> {
    return this.repository.save(dto);
  }

  update<T extends Partial<SessionEntity>>(dto: T): Promise<T> {
    return this.repository.save(dto);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
