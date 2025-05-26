import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { Column, CreateDateColumn, Table } from 'src/sql-tools';

@Table('partners_audit')
export class PartnerAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: string;

  @Column({ type: 'uuid', indexName: 'IDX_partners_audit_shared_by_id' })
  sharedById!: string;

  @Column({ type: 'uuid', indexName: 'IDX_partners_audit_shared_with_id' })
  sharedWithId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', indexName: 'IDX_partners_audit_deleted_at' })
  deletedAt!: Date;
}
