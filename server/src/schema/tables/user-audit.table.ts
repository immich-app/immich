import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { Column, ColumnIndex, CreateDateColumn, Table } from 'src/sql-tools';

@Table('users_audit')
export class UserAuditTable {
  @Column({ type: 'uuid' })
  userId!: string;

  @ColumnIndex('IDX_users_audit_deleted_at')
  @CreateDateColumn({ default: () => 'clock_timestamp()' })
  deletedAt!: Date;

  @PrimaryGeneratedUuidV7Column()
  id!: string;
}
