import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

/**
 * Stores user vault encryption keys.
 * The vault key (KEK) is encrypted with the user's vault password.
 */
@Table('user_vault')
export class UserVaultTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', unique: true })
  userId!: string;

  @Column({ type: 'character varying', nullable: false })
  kdfSalt!: string;

  @Column({ type: 'jsonb', nullable: false })
  kdfParams!: {
    algorithm: string;
    memoryMiB: number;
    iterations: number;
    parallelism: number;
  };

  @Column({ type: 'character varying', nullable: false })
  encryptedVaultKey!: string;

  @Column({ type: 'character varying', nullable: true })
  adminEncryptedVaultKey!: string | null;

  @Column({ type: 'character varying', nullable: false })
  vaultKeyHash!: string;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}
