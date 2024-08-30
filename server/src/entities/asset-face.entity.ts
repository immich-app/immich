import { AssetEntity } from 'src/entities/asset.entity';
import { FaceSearchEntity } from 'src/entities/face-search.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { SourceType } from 'src/enum';
import { Column, Entity, Index, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @OneToOne(() => FaceSearchEntity, (faceSearchEntity) => faceSearchEntity.face, { cascade: ['insert'] })
  faceSearch?: FaceSearchEntity;

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

  @Column({ default: SourceType.MACHINE_LEARNING, type: 'enum', enum: SourceType })
  sourceType!: SourceType;

  @ManyToOne(() => AssetEntity, (asset) => asset.faces, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  asset!: AssetEntity;

  @ManyToOne(() => PersonEntity, (person) => person.faces, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  person!: PersonEntity | null;
}
