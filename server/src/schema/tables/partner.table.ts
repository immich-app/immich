import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { partners_delete_audit } from 'src/schema/functions';
import { UserTable } from 'src/schema/tables/user.table';
import {
  AfterDeleteTrigger,
  Column,
  ColumnIndex,
  CreateDateColumn,
  ForeignKeyColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('partners')
@UpdatedAtTrigger('partners_updated_at')
@AfterDeleteTrigger({
  name: 'partners_delete_audit',
  scope: 'statement',
  function: partners_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
export class PartnerTable {
  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  sharedById!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  sharedWithId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'boolean', default: false })
  inTimeline!: boolean;

  @ColumnIndex('IDX_partners_update_id')
  @UpdateIdColumn()
  updateId!: string;
}
