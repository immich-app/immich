import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { AssetMetadataKey } from 'src/enum';
import { Column, CreateDateColumn, Generated, Table, Timestamp } from 'src/sql-tools';

@Table('asset_metadata_audit')
export class AssetMetadataAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'uuid', index: true })
  assetId!: string;

  @Column({ index: true })
  key!: AssetMetadataKey;

  @CreateDateColumn({ default: () => 'clock_timestamp()', index: true })
  deletedAt!: Generated<Timestamp>;
}
