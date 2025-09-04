import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { MemoryTable } from 'src/schema/tables/memory.table';
import { Column, CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp } from 'src/sql-tools';

@Table('memory_asset_audit')
export class MemoryAssetAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @ForeignKeyColumn(() => MemoryTable, { type: 'uuid', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  memoryId!: string;

  @Column({ type: 'uuid', index: true })
  assetId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', index: true })
  deletedAt!: Generated<Timestamp>;
}
