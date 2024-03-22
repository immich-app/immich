import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('person')
@Check(`"birthDate" <= CURRENT_DATE`)
export class PersonEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column()
  ownerId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: UserEntity;

  @Column({ default: '' })
  name!: string;

  @Column({ type: 'date', nullable: true })
  birthDate!: Date | null;

  @Column({ default: '' })
  thumbnailPath!: string;

  @Column({ nullable: true })
  faceAssetId!: string | null;

  @ManyToOne(() => AssetFaceEntity, { onDelete: 'SET NULL', nullable: true })
  faceAsset!: AssetFaceEntity | null;

  @OneToMany(() => AssetFaceEntity, (assetFace) => assetFace.person)
  faces!: AssetFaceEntity[];

  @Column({ default: false })
  isHidden!: boolean;
}
