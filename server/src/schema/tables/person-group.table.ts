import {
  AfterDeleteTrigger,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { CreateIdColumn, UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { person_group_delete_audit } from 'src/schema/functions';
import { ClusterGroupTable } from 'src/schema/tables/cluster-group.table';

@Table('person_group')
@UpdatedAtTrigger('person_group_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: person_group_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
export class PersonGroupTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => ClusterGroupTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  clusterGroupId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @CreateIdColumn({ index: true })
  createId!: Generated<string>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
