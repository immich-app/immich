import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('assets_audit')
export class AssetAuditEntity {
  @PrimaryColumn({ type: 'uuid', nullable: false, default: () => 'immich_uuid_v7()' })
  id!: string;

  @Index('IDX_assets_audit_asset_id')
  @Column({ type: 'uuid' })
  assetId!: string;

  @Index('IDX_assets_audit_owner_id')
  @Column({ type: 'uuid' })
  ownerId!: string;

  @Index('IDX_assets_audit_deleted_at')
  @CreateDateColumn({ type: 'timestamptz', default: () => 'clock_timestamp()' })
  deletedAt!: Date;
}
