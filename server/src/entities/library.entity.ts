import { Generated, NonAttribute } from 'kysely-typeorm';
import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('libraries')
export class LibraryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @Column()
  name!: string;

  @OneToMany(() => AssetEntity, (asset) => asset.library)
  @JoinTable()
  assets!: NonAttribute<AssetEntity[]>;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: NonAttribute<UserEntity>;

  @Column()
  ownerId!: string;

  @Column('text', { array: true })
  importPaths!: string[];

  @Column('text', { array: true })
  exclusionPatterns!: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Generated<Date>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Generated<Date>;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  refreshedAt!: Date | null;
}
