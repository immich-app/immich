import {
  AfterDeleteTrigger,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { person_delete_audit } from 'src/schema/functions';
import { FaceClusterTable } from 'src/schema/tables/face-cluster.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('person')
@UpdatedAtTrigger('person_cluster_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: person_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
@Unique({ name: 'UQ_ownerId_faceClusterId', columns: ['ownerId', 'faceClusterId'] })
export class PersonTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @ForeignKeyColumn(() => FaceClusterTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', index: true })
  faceClusterId!: string;

  @Column({ type: 'boolean', default: false })
  isHidden!: Generated<boolean>;

  @Column({ type: 'boolean', default: false })
  isFavorite!: Generated<boolean>;

  @Column({ default: '' })
  thumbnailPath!: Generated<string>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
