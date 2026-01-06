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
} from 'src/sql-tools';

/**
 * Stores per-asset encryption metadata.
 * Each asset has its own DEK (Data Encryption Key) wrapped with the user's vault key.
 */
@Table('asset_encryption')
@Unique({ columns: ['assetId', 'vaultVersion'] })
export class AssetEncryptionTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE' })
  assetId!: string;

  @Column({ type: 'character varying', nullable: false })
  wrappedDek!: string;

  @Column({ type: 'character varying', nullable: false })
  fileIv!: string;

  @Column({ type: 'character varying', nullable: false })
  authTag!: string;

  @Column({ type: 'character varying', default: 'aes-256-gcm' })
  algorithm!: string;

  @Column({ type: 'integer', default: 1 })
  vaultVersion!: number;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
