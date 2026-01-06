import {
  Column,
  CreateDateColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
} from 'src/sql-tools';

/**
 * Stores admin public keys for vault recovery.
 * The admin private key should be stored offline/HSM.
 */
@Table('admin_recovery_key')
export class AdminRecoveryKeyTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ type: 'text', nullable: false })
  publicKey!: string;

  @Column({ type: 'character varying', nullable: false, unique: true })
  keyId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
