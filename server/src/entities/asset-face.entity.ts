import { AssetEntity } from 'src/entities/asset.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('asset_faces', { synchronize: false })
@Index('IDX_asset_faces_assetId_personId', ['assetId', 'personId'])
@Index(['personId', 'assetId'])
export class AssetFaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  assetId!: string;

  @Column({ nullable: true, type: 'uuid' })
  personId!: string | null;

  @Index('face_index', { synchronize: false })
  @Column({ type: 'float4', array: true, select: false, transformer: { from: (v) => JSON.parse(v), to: (v) => v } })
  embedding!: number[];

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

  @ManyToOne(() => PersonEntity, (person) => person.faces, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  person!: PersonEntity | null;
}
