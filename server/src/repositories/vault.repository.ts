import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/schema';
import { UserVaultTable } from 'src/schema/tables/user-vault.table';

export type UserVault = {
  id: string;
  userId: string;
  kdfSalt: string;
  kdfParams: {
    algorithm: string;
    memoryMiB: number;
    iterations: number;
    parallelism: number;
  };
  encryptedVaultKey: string;
  adminEncryptedVaultKey: string | null;
  vaultKeyHash: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class VaultRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async getByUserId(userId: string): Promise<UserVault | null> {
    const result = await this.db
      .selectFrom('user_vault')
      .selectAll()
      .where('userId', '=', userId)
      .executeTakeFirst();

    return result ? this.mapToUserVault(result) : null;
  }

  async create(data: Insertable<UserVaultTable>): Promise<UserVault> {
    const result = await this.db
      .insertInto('user_vault')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToUserVault(result);
  }

  async update(userId: string, data: Updateable<UserVaultTable>): Promise<UserVault> {
    const result = await this.db
      .updateTable('user_vault')
      .set(data)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToUserVault(result);
  }

  async delete(userId: string): Promise<void> {
    await this.db
      .deleteFrom('user_vault')
      .where('userId', '=', userId)
      .execute();
  }

  async exists(userId: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('user_vault')
      .select('id')
      .where('userId', '=', userId)
      .executeTakeFirst();

    return !!result;
  }

  private mapToUserVault(row: any): UserVault {
    return {
      id: row.id,
      userId: row.userId,
      kdfSalt: row.kdfSalt,
      kdfParams: row.kdfParams,
      encryptedVaultKey: row.encryptedVaultKey,
      adminEncryptedVaultKey: row.adminEncryptedVaultKey,
      vaultKeyHash: row.vaultKeyHash,
      version: row.version,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
