import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { AssetEntity } from './asset.entity';

@Entity('smart_search')
export class SmartSearchEntity {
  @OneToOne(() => AssetEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'assetId', referencedColumnName: 'id' })
  asset?: AssetEntity;

  @PrimaryColumn()
  assetId!: string;

  @Column({
    type: 'float4',
    array: true,
  })
  embedding!: number[];
}
