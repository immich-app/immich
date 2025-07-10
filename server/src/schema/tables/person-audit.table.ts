import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { Column, CreateDateColumn, Generated, Table, Timestamp } from 'src/sql-tools';

@Table('person_audit')
export class PersonAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'uuid', indexName: 'IDX_person_audit_person_id' })
  personId!: string;

  @Column({ type: 'uuid', indexName: 'IDX_person_audit_owner_id' })
  ownerId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', indexName: 'IDX_person_audit_deleted_at' })
  deletedAt!: Generated<Timestamp>;
}
