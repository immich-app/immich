import { Generated, NonAttribute } from 'kysely-typeorm';
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
  id!: Generated<string>;

  @Column()
  value!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Generated<Date>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Generated<Date>;

  @Column({ type: 'varchar', nullable: true, default: null })
  color!: Generated<string> | null;

  @Column({ nullable: true })
  parentId?: string;

  @TreeParent({ onDelete: 'CASCADE' })
  parent!: NonAttribute<TagEntity>;

  @TreeChildren()
  children?: TagEntity[];

  @ManyToOne(() => UserEntity, (user) => user.tags, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user!: NonAttribute<UserEntity>;

  @Column()
  userId!: string;

  @ManyToMany(() => AssetEntity, (asset) => asset.tags, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  assets!: NonAttribute<AssetEntity[]>;
}
