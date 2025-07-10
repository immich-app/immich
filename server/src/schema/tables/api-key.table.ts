import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { Permission } from 'src/enum';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('api_keys')
@UpdatedAtTrigger('api_keys_updated_at')
export class ApiKeyTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column()
  name!: string;

  @Column()
  key!: string;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ array: true, type: 'character varying' })
  permissions!: Permission[];

  @UpdateIdColumn({ indexName: 'IDX_api_keys_update_id' })
  updateId!: Generated<string>;
}
