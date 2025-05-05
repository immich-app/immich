import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { Permission } from 'src/enum';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('api_keys')
@UpdatedAtTrigger('api_keys_updated_at')
export class APIKeyTable {
  @Column()
  name!: string;

  @Column()
  key!: string;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ array: true, type: 'character varying' })
  permissions!: Permission[];

  @UpdateIdColumn({ indexName: 'IDX_api_keys_update_id' })
  updateId?: string;
}
