import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { Column, CreateDateColumn, Table } from 'src/sql-tools';

@Table('users_audit')
export class UserAuditTable {
  @Column({ type: 'uuid' })
  userId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', indexName: 'IDX_users_audit_deleted_at' })
  deletedAt!: Date;

  @PrimaryGeneratedUuidV7Column()
  id!: string;
}
