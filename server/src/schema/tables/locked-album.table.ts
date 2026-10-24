import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  type Generated,
  PrimaryGeneratedColumn,
  Table,
  type Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UserTable } from 'src/schema/tables/user.table.js';

// Deliberately separate from ordinary albums and their access grants and sync stream.
@Table('locked_album')
export class LockedAlbumTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false, index: true })
  ownerId!: string;

  @Column()
  albumName!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}
