import {
  AfterDeleteTrigger,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { CreateIdColumn, UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { partner_delete_audit } from 'src/schema/functions';
import { UserTable } from 'src/schema/tables/user.table';

@Table('partner')
@UpdatedAtTrigger('partner_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: partner_delete_audit,
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

  @CreateIdColumn({ index: true })
  createId!: Generated<string>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ type: 'boolean', default: false })
  inTimeline!: Generated<boolean>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
