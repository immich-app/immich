import { Column, CreateDateColumn, Generated, Table, Timestamp } from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators';

@Table('face_cluster_audit')
export class FaceClusterAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'uuid', index: true })
  faceClusterId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', index: true })
  deletedAt!: Generated<Timestamp>;
}
