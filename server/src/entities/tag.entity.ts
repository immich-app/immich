import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tags')
@Unique(['userId', 'value'])
@Tree('closure-table')
export class TagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  value!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'varchar', nullable: true, default: null })
  color!: string | null;

  @Column({ nullable: true })
  parentId?: string;

  @TreeParent({ onDelete: 'CASCADE' })
  parent?: TagEntity;

  @TreeChildren()
  children?: TagEntity[];

  @ManyToOne(() => UserEntity, (user) => user.tags, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user?: UserEntity;

  @Column()
  userId!: string;

  @ManyToMany(() => AssetEntity, (asset) => asset.tags, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  assets?: AssetEntity[];
}
