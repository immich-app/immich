import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/schema';
import { AdminRecoveryKeyTable } from 'src/schema/tables/admin-recovery-key.table';

export type AdminRecoveryKey = {
  id: string;
  publicKey: string;
  keyId: string;
  createdAt: Date;
};

@Injectable()
export class AdminRecoveryKeyRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async get(id: string): Promise<AdminRecoveryKey | null> {
    const result = await this.db
      .selectFrom('admin_recovery_key')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return result
      ? {
          ...result,
          createdAt: new Date(result.createdAt),
        }
      : null;
  }

  async getByKeyId(keyId: string): Promise<AdminRecoveryKey | null> {
    const result = await this.db
      .selectFrom('admin_recovery_key')
      .selectAll()
      .where('keyId', '=', keyId)
      .executeTakeFirst();

    return result
      ? {
          ...result,
          createdAt: new Date(result.createdAt),
        }
      : null;
  }

  async getAll(): Promise<AdminRecoveryKey[]> {
    const results = await this.db.selectFrom('admin_recovery_key').selectAll().execute();

    return results.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt),
    }));
  }

  async getFirst(): Promise<AdminRecoveryKey | null> {
    const result = await this.db
      .selectFrom('admin_recovery_key')
      .selectAll()
      .orderBy('createdAt', 'asc')
      .limit(1)
      .executeTakeFirst();

    return result
      ? {
          ...result,
          createdAt: new Date(result.createdAt),
        }
      : null;
  }

  async create(data: Insertable<AdminRecoveryKeyTable>): Promise<AdminRecoveryKey> {
    const result = await this.db
      .insertInto('admin_recovery_key')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      ...result,
      createdAt: new Date(result.createdAt),
    };
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('admin_recovery_key').where('id', '=', id).execute();
  }

  async exists(): Promise<boolean> {
    const result = await this.db
      .selectFrom('admin_recovery_key')
      .select((eb) => eb.fn.count('id').as('count'))
      .executeTakeFirst();

    return Number(result?.count ?? 0) > 0;
  }
}
