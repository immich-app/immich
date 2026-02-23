import { Column, CreateDateColumn, Generated, Table, Timestamp } from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { UserMetadataKey } from 'src/enum';

@Table('user_metadata_audit')
export class UserMetadataAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'uuid', indexName: 'IDX_user_metadata_audit_user_id' })
  userId!: string;

  @Column({ indexName: 'IDX_user_metadata_audit_key' })
  key!: UserMetadataKey;

  @CreateDateColumn({ default: () => 'clock_timestamp()', indexName: 'IDX_user_metadata_audit_deleted_at' })
  deletedAt!: Generated<Timestamp>;
}
