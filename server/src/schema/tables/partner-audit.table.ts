import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { Column, ColumnIndex, CreateDateColumn, Table } from 'src/sql-tools';

@Table('partners_audit')
export class PartnerAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: string;

  @ColumnIndex('IDX_partners_audit_shared_by_id')
  @Column({ type: 'uuid' })
  sharedById!: string;

  @ColumnIndex('IDX_partners_audit_shared_with_id')
  @Column({ type: 'uuid' })
  sharedWithId!: string;

  @ColumnIndex('IDX_partners_audit_deleted_at')
  @CreateDateColumn({ default: () => 'clock_timestamp()' })
  deletedAt!: Date;
}
