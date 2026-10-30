import { CreateDateColumn, type Generated, Table } from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators.js';

@Table('asset_ocr_reset_audit')
export class AssetOcrResetAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @CreateDateColumn({ default: () => 'clock_timestamp()', index: true })
  deletedAt!: Date;
}
