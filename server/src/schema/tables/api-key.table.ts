import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { Permission } from 'src/enum';
import { UserTable } from 'src/schema/tables/user.table';

@Table('api_key')
@UpdatedAtTrigger('api_key_updatedAt')
export class ApiKeyTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column()
  name!: string;

  @Column({ type: 'bytea', index: true })
  key!: Buffer;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ array: true, type: 'character varying' })
  permissions!: Permission[];

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
