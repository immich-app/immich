import {
  Column,
  CreateDateColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';

@Table('cluster_group')
@UpdatedAtTrigger('cluster_group_updatedAt')
export class ClusterGroupTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ type: 'character varying', nullable: true, default: null })
  name!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
