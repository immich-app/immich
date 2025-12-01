import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetFileType } from 'src/enum';
import { AssetTable } from 'src/schema/tables/asset.table';
import {
    Column,
    CreateDateColumn,
    ForeignKeyColumn,
    Generated,
    PrimaryGeneratedColumn,
    Table,
    Timestamp,
    Unique,
    UpdateDateColumn,
} from 'src/sql-tools';

@Table('asset_file')
@Unique({ columns: ['assetId', 'type'] })
@UpdatedAtTrigger('asset_file_updatedAt')
export class AssetFileTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  assetId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column()
  type!: AssetFileType;

  @Column()
  path!: string;

  // Encryption metadata (nullable when not encrypted)
  @Column({ type: 'boolean', default: false })
  encrypted!: Generated<boolean>;

  @Column({ type: 'character varying', nullable: true })
  encryptionAlgo!: string | null;

  @Column({ type: 'bytea', nullable: true })
  encryptionIv!: Buffer | null;

  @Column({ type: 'bytea', nullable: true })
  encryptedDek!: Buffer | null;

  @Column({ type: 'bytea', nullable: true })
  encryptionTag!: Buffer | null;

  @Column({ type: 'integer', nullable: true })
  encryptionVersion!: number | null;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
