import { AssetEntity } from 'src/entities/asset.entity';
import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@Entity('smart_search', { synchronize: false })
export class SmartSearchEntity {
  @OneToOne(() => AssetEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'assetId', referencedColumnName: 'id' })
  asset?: AssetEntity;

  @PrimaryColumn()
  assetId!: string;

  @Index('clip_index', { synchronize: false })
  @Column({
    type: 'float4',
    array: true,
    select: false,
  })
  embedding!: number[];
}
