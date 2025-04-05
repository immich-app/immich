import { SharedLinkType } from 'src/enum';
import { AlbumTable } from 'src/schema/tables/album.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  ColumnIndex,
  CreateDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  Unique,
} from 'src/sql-tools';

@Table('shared_links')
@Unique({ name: 'UQ_sharedlink_key', columns: ['key'] })
export class SharedLinkTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ type: 'character varying', nullable: true })
  description!: string | null;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  userId!: string;

  @ColumnIndex('IDX_sharedlink_key')
  @Column({ type: 'bytea' })
  key!: Buffer; // use to access the inidividual asset

  @Column()
  type!: SharedLinkType;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  allowUpload!: boolean;

  @ColumnIndex('IDX_sharedlink_albumId')
  @ForeignKeyColumn(() => AlbumTable, { nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  albumId!: string;

  @Column({ type: 'boolean', default: true })
  allowDownload!: boolean;

  @Column({ type: 'boolean', default: true })
  showExif!: boolean;

  @Column({ type: 'character varying', nullable: true })
  password!: string | null;
}
