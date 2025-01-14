import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { ApiKeys, DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { APIKeyEntity } from 'src/entities/api-key.entity';
import { IKeyRepository } from 'src/interfaces/api-key.interface';
import { AuthApiKey } from 'src/types';
import { asUuid } from 'src/utils/database';
import { Repository } from 'typeorm';

const columns = ['id', 'name', 'userId', 'createdAt', 'updatedAt', 'permissions'] as const;

@Injectable()
export class ApiKeyRepository implements IKeyRepository {
  constructor(
    @InjectRepository(APIKeyEntity) private repository: Repository<APIKeyEntity>,
    @InjectKysely() private db: Kysely<DB>,
  ) {}

  async create(dto: Insertable<ApiKeys>): Promise<APIKeyEntity> {
    const { id, name, createdAt, updatedAt, permissions } = await this.db
      .insertInto('api_keys')
      .values(dto)
      .returningAll()
      .executeTakeFirstOrThrow();

    return { id, name, createdAt, updatedAt, permissions } as APIKeyEntity;
  }

  async update(userId: string, id: string, dto: Updateable<ApiKeys>): Promise<APIKeyEntity> {
    return this.db
      .updateTable('api_keys')
      .set(dto)
      .where('api_keys.userId', '=', userId)
      .where('id', '=', asUuid(id))
      .returningAll()
      .executeTakeFirstOrThrow() as unknown as Promise<APIKeyEntity>;
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.db.deleteFrom('api_keys').where('userId', '=', userId).where('id', '=', asUuid(id)).execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getKey(hashedToken: string): Promise<AuthApiKey | undefined> {
    return this.db
      .selectFrom('api_keys')
      .innerJoinLateral(
        (eb) =>
          eb
            .selectFrom('users')
            .selectAll('users')
            .select((eb) =>
              eb
                .selectFrom('user_metadata')
                .whereRef('users.id', '=', 'user_metadata.userId')
                .select((eb) => eb.fn('array_agg', [eb.table('user_metadata')]).as('metadata'))
                .as('metadata'),
            )
            .whereRef('users.id', '=', 'api_keys.userId')
            .where('users.deletedAt', 'is', null)
            .as('user'),
        (join) => join.onTrue(),
      )
      .select((eb) => [
        'api_keys.id',
        'api_keys.key',
        'api_keys.userId',
        'api_keys.permissions',
        eb.fn.toJson('user').as('user'),
      ])
      .where('api_keys.key', '=', hashedToken)
      .executeTakeFirst() as Promise<AuthApiKey | undefined>;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getById(userId: string, id: string): Promise<APIKeyEntity | null> {
    return this.db
      .selectFrom('api_keys')
      .select(columns)
      .where('id', '=', asUuid(id))
      .where('userId', '=', userId)
      .executeTakeFirst() as unknown as Promise<APIKeyEntity | null>;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByUserId(userId: string): Promise<APIKeyEntity[]> {
    return this.db
      .selectFrom('api_keys')
      .select(columns)
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .execute() as unknown as Promise<APIKeyEntity[]>;
  }
}
