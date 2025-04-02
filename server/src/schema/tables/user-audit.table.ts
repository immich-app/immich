import { Column, ColumnIndex, CreateDateColumn, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table('users_audit')
export class UserAuditTable {
  @PrimaryGeneratedColumn({ type: 'v7' })
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ColumnIndex('IDX_users_audit_deleted_at')
  @CreateDateColumn({ default: () => 'clock_timestamp()' })
  deletedAt!: Date;
}
