import { CreateIdColumn, UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { partners_delete_audit } from 'src/schema/functions';
import { UserTable } from 'src/schema/tables/user.table';
import {
  AfterDeleteTrigger,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('partners')
@UpdatedAtTrigger('partners_updated_at')
@AfterDeleteTrigger({
  scope: 'statement',
  function: partners_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
export class PartnerTable {
  @ForeignKeyColumn(() => UserTable, {
    onDelete: 'CASCADE',
    primary: true,
    // [sharedById, sharedWithId] is the PK constraint
    index: false,
  })
  sharedById!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  sharedWithId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @CreateIdColumn({ indexName: 'IDX_partners_create_id' })
  createId!: Generated<string>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ type: 'boolean', default: false })
  inTimeline!: Generated<boolean>;

  @UpdateIdColumn({ indexName: 'IDX_partners_update_id' })
  updateId!: Generated<string>;
}
