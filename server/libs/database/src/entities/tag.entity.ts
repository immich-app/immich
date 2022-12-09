import { TagType } from '@app/common';
import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AssetEntity } from './asset.entity';
import { UserEntity } from './user.entity';

@Entity('tags')
@Unique('UQ_tag_name_userId', ['name', 'userId'])
export class TagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type!: TagType;

  @Column()
  name!: string;

  @Column()
  userId!: string;

  @Column({ type: 'uuid', comment: 'The new renamed tagId', nullable: true })
  renameTagId?: string;

  @ManyToMany(() => AssetEntity, (asset) => asset.tags)
  assets!: AssetEntity[];

  @ManyToOne(() => UserEntity, (user) => user.tags)
  user!: UserEntity;
}
