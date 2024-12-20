import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@Entity('face_search', { synchronize: false })
export class FaceSearchEntity {
  @OneToOne(() => AssetFaceEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'faceId', referencedColumnName: 'id' })
  face?: AssetFaceEntity;

  @PrimaryColumn()
  faceId!: string;

  @Index('face_index', { synchronize: false })
  @Column({
    type: 'float4',
    array: true,
    transformer: { from: JSON.parse, to: (v) => `[${v}]` },
  })
  embedding!: number[];
}
