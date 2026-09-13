import type { Generated } from '@immich/sql-tools';
import { Column, CreateDateColumn, ForeignKeyColumn, Table, Timestamp } from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators.js';
import { TagTable } from 'src/schema/tables/tag.table.js';

@Table('tag_asset_audit')
export class TagAssetAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @ForeignKeyColumn(() => TagTable, { type: 'uuid', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  tagId!: string;

  @Column({ type: 'uuid', index: true })
  assetId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', index: true })
  deletedAt!: Generated<Timestamp>;
}
