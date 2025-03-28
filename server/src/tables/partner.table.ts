import {
  Column,
  ColumnIndex,
  CreateDateColumn,
  ForeignKeyColumn,
  Table,
  UpdateDateColumn,
  UpdateIdColumn,
} from 'src/sql-tools';
import { UserTable } from 'src/tables/user.table';

@Table('partners')
export class PartnerTable {
  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  sharedById!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  sharedWithId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ColumnIndex('IDX_partners_update_id')
  @UpdateIdColumn()
  updateId!: string;

  @Column({ type: 'boolean', default: false })
  inTimeline!: boolean;
}
