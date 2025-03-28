import {
  Column,
  ColumnIndex,
  CreateDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
  UpdateIdColumn,
} from 'src/sql-tools';
import { UserTable } from 'src/tables/user.table';

@Table({ name: 'sessions', primaryConstraintName: 'PK_48cb6b5c20faa63157b3c1baf7f' })
export class SessionTable {
  @PrimaryGeneratedColumn()
  id!: string;

  // TODO convert to byte[]
  @Column()
  token!: string;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ColumnIndex('IDX_sessions_update_id')
  @UpdateIdColumn()
  updateId!: string;

  @Column({ default: '' })
  deviceType!: string;

  @Column({ default: '' })
  deviceOS!: string;
}
