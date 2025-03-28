import {
  Column,
  ColumnIndex,
  CreateDateColumn,
  DeleteDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
  UpdateIdColumn,
} from 'src/sql-tools';
import { UserTable } from 'src/tables/user.table';

@Table('libraries')
export class LibraryTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  name!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column({ type: 'text', array: true })
  importPaths!: string[];

  @Column({ type: 'text', array: true })
  exclusionPatterns!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ColumnIndex('IDX_libraries_update_id')
  @UpdateIdColumn()
  updateId?: string;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  refreshedAt!: Date | null;
}
