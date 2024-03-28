import { AssetEntity } from 'src/entities/asset.entity';
import { Entity, Index, JoinColumn, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('asset_duplicates')
@Index('asset_duplicates_assetId_uindex', ['assetId'], { unique: true })
export class AssetDuplicateEntity {
  @OneToMany(() => AssetEntity, (asset) => asset.duplicates)
  @JoinColumn({ name: 'assetId', referencedColumnName: 'id' })
  assets!: AssetEntity;

  @PrimaryColumn()
  id!: string;

  @PrimaryColumn()
  assetId!: string;
}
