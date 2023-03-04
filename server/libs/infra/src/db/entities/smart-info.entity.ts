import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { AssetEntity } from './asset.entity';

@Entity('smart_info')
export class SmartInfoEntity {
  @OneToOne(() => AssetEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'assetId', referencedColumnName: 'id' })
  asset?: AssetEntity;

  @PrimaryColumn()
  assetId!: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags!: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  objects!: string[] | null;

  @Column('numeric', { precision: 20, scale: 19, nullable: true, array: true })
  clip!: number[] | null;
}
