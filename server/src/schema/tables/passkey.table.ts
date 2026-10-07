import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  type Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { ColumnType } from 'kysely';
import { UpdateIdColumn, UpdatedAtTrigger } from 'src/decorators.js';
import { UserTable } from 'src/schema/tables/user.table.js';

@Table('passkey')
@UpdatedAtTrigger('passkey_updatedAt')
export class PasskeyTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ nullable: true })
  name!: string | null;

  @Column({ unique: true })
  credentialId!: string;

  @Column({ type: 'bytea' })
  publicKey!: Buffer;

  @Column({ type: 'bigint', default: 0 })
  counter!: Generated<ColumnType<number>>;

  @Column({ array: true, type: 'character varying' })
  transports!: string[];

  @Column({ type: 'boolean', default: false })
  backedUp!: Generated<boolean>;

  @Column()
  deviceType!: string;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  usedAt!: Timestamp | null;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
