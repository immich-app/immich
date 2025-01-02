import { Generated, NonAttribute } from 'kysely-typeorm';
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
  id!: Generated<string>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Generated<Date>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Generated<Date>;

  @Column()
  ownerId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: NonAttribute<UserEntity>;

  @Column({ default: '' })
  name!: Generated<string>;

  @Column({ type: 'date', nullable: true })
  birthDate!: string | null;

  @Column({ default: '' })
  thumbnailPath!: Generated<string>;

  @Column({ nullable: true })
  faceAssetId!: string | null;

  @ManyToOne(() => AssetFaceEntity, { onDelete: 'SET NULL', nullable: true })
  faceAsset!: NonAttribute<AssetFaceEntity | null>;

  @OneToMany(() => AssetFaceEntity, (assetFace) => assetFace.person)
  faces!: NonAttribute<AssetFaceEntity[]>;

  @Column({ default: false })
  isHidden!: Generated<boolean>;
}
