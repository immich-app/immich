import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { MemoryTable } from 'src/schema/tables/memory.table';
import { Column, CreateDateColumn, ForeignKeyColumn, Table } from 'src/sql-tools';

@Table('memory_assets_audit')
export class MemoryAssetAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: string;

  @ForeignKeyColumn(() => MemoryTable, {
    type: 'uuid',
    indexName: 'IDX_memory_assets_audit_memory_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  memoryId!: string;

  @Column({ type: 'uuid', indexName: 'IDX_memory_assets_audit_asset_id' })
  assetId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', indexName: 'IDX_memory_assets_audit_deleted_at' })
  deletedAt!: Date;
}
