import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('libraries')
export class LibraryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @OneToMany(() => AssetEntity, (asset) => asset.library)
  @JoinTable()
  assets!: AssetEntity[];

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner?: UserEntity;

  @Column()
  ownerId!: string;

  @Column('text', { array: true })
  importPaths!: string[];

  @Column('text', { array: true })
  exclusionPatterns!: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Index('IDX_libraries_update_id')
  @Column({ type: 'uuid', nullable: false, default: () => 'immich_uuid_v7()' })
  updateId?: string;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  refreshedAt!: Date | null;
}
