import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { UserStatus } from 'src/enum';
import { DB } from 'src/schema';
import { UserTable } from 'src/schema/tables/user.table';

export interface UserListFilter {
  withDeleted?: boolean;
}

export interface UserFindOptions {
  withDeleted?: boolean;
}

@Injectable()
export class UserRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string, options?: UserFindOptions) {
    return this.db
      .selectFrom('user')
      .select(columns.user)
      .$if(!options?.withDeleted, (eb) => eb.where('user.deletedAt', 'is', null))
      .where('user.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAdmin(id?: string) {
    return this.db
      .selectFrom('user')
      .select(columns.userAdmin)
      .$if(!!id, (eb) => eb.where('user.id', '=', id!))
      .$if(!id, (eb) => eb.where('user.isAdmin', '=', true))
      .where('user.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.EMAIL] })
  getByEmail(email: string, options?: { withPassword?: boolean }) {
    return this.db
      .selectFrom('user')
      .select(columns.userAdmin)
      .$if(!!options?.withPassword, (eb) => eb.select('password'))
      .where('email', '=', email)
      .where('user.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql()
  async hasAdmin(): Promise<boolean> {
    const admin = await this.db
      .selectFrom('user')
      .select('user.id')
      .where('user.isAdmin', '=', true)
      .where('user.deletedAt', 'is', null)
      .executeTakeFirst();

    return !!admin;
  }

  @GenerateSql(
    { name: 'with deleted', params: [{ withDeleted: true }] },
    { name: 'without deleted', params: [{ withDeleted: false }] },
  )
  getList({ withDeleted }: UserListFilter = {}) {
    return this.db
      .selectFrom('user')
      .select(columns.userAdmin)
      .$if(!withDeleted, (eb) => eb.where('user.deletedAt', 'is', null))
      .orderBy('createdAt', 'desc')
      .execute();
  }

  @GenerateSql({ params: [new Date()] })
  getDeletedAfter(date: Date) {
    return this.db.selectFrom('user').select(['id']).where('user.deletedAt', '<', date).execute();
  }

  async create(dto: Insertable<UserTable>) {
    return this.db.insertInto('user').values(dto).returning(columns.userAdmin).executeTakeFirstOrThrow();
  }

  update(id: string, dto: Updateable<UserTable>) {
    return this.db
      .updateTable('user')
      .set(dto)
      .where('user.id', '=', id)
      .where('user.deletedAt', 'is', null)
      .returning(columns.userAdmin)
      .executeTakeFirstOrThrow();
  }

  delete(id: string, hard?: boolean) {
    return hard
      ? this.db.deleteFrom('user').where('id', '=', id).execute()
      : this.db
          .updateTable('user')
          .set({ deletedAt: new Date(), status: UserStatus.Removing })
          .where('id', '=', id)
          .execute();
  }

  @GenerateSql()
  async getCount(): Promise<number> {
    const result = await this.db
      .selectFrom('user')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('user.deletedAt', 'is', null)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }
}
