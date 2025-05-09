import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { Column, CreateDateColumn, Table } from 'src/sql-tools';

@Table('album_users_audit')
export class AlbumUserAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: string;

  @Column({ type: 'uuid', indexName: 'IDX_album_users_audit_album_id' })
  albumId!: string;

  @Column({ type: 'uuid', indexName: 'IDX_album_users_audit_user_id' })
  userId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', indexName: 'IDX_album_users_audit_deleted_at' })
  deletedAt!: Date;
}
