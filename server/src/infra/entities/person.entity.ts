import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssetFaceEntity } from './asset-face.entity';
import { UserEntity } from './user.entity';

@Entity('person')
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

  @OneToMany(() => AssetFaceEntity, (assetFace) => assetFace.person)
  faces!: AssetFaceEntity[];

  @Column({ default: false })
  isHidden!: boolean;
}
