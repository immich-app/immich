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

  @Column({
    type: 'numeric',
    array: true,
    nullable: true,
    // note: migration generator is broken for numeric[], but these _are_ set in the database
    // precision: 20,
    // scale: 19,
  })
  clipEmbedding!: number[] | null;
}
