import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssetEntity } from './asset.entity';
import { UserEntity } from './user.entity';

@Entity('libraries')
export class LibraryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToMany(() => AssetEntity, (asset) => asset.library)
  @JoinTable()
  assets!: AssetEntity[];

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: UserEntity;

  @Column()
  ownerId!: string;

  @Column()
  type!: LibraryType;

  @Column('text', { array: true })
  importPaths?: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  refreshedAt!: Date;

  @Column({ type: 'boolean', default: true })
  isVisible!: boolean;
}

export enum LibraryType {
  UPLOAD = 'UPLOAD',
  IMPORT = 'IMPORT',
}
