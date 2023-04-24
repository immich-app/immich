import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { AssetFaceEntity } from './asset-face.entity';

@Entity('person')
export class PersonEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  ownerId!: string;

  @Column()
  name!: string;

  @Column()
  thumbnailPath!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: string;

  @OneToMany(() => AssetFaceEntity, (assetFace) => assetFace.person)
  faces!: AssetFaceEntity[];

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: UserEntity;
}
