import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AssetEntity } from './asset.entity';
import { PersonEntity } from './person.entity';

@Entity('asset_faces')
@Index(['personId', 'assetId'])
export class AssetFaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  assetId!: string;

  @Column({ nullable: true, type: 'uuid' })
  personId!: string | null;

  @Column({
    type: 'float4',
    array: true,
    nullable: true,
  })
  embedding!: number[] | null;

  @Column({ default: 0, type: 'int' })
  imageWidth!: number;

  @Column({ default: 0, type: 'int' })
  imageHeight!: number;

  @Column({ default: 0, type: 'int' })
  boundingBoxX1!: number;

  @Column({ default: 0, type: 'int' })
  boundingBoxY1!: number;

  @Column({ default: 0, type: 'int' })
  boundingBoxX2!: number;

  @Column({ default: 0, type: 'int' })
  boundingBoxY2!: number;

  @ManyToOne(() => AssetEntity, (asset) => asset.faces, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  asset!: AssetEntity;

  @ManyToOne(() => PersonEntity, (person) => person.faces, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  person!: PersonEntity | null;
}
