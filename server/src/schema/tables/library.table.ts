import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('libraries')
@UpdatedAtTrigger('libraries_updated_at')
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

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  refreshedAt!: Date | null;

  @UpdateIdColumn({ indexName: 'IDX_libraries_update_id' })
  updateId?: string;
}
