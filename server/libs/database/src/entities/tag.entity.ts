import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AssetEntity } from './asset.entity';
import { UserEntity } from './user.entity';

@Entity('tags')
export class TagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type!: TagType;

  @Column()
  name!: string;

  @Column({ type: 'uuid', comment: 'The new renamed tagId', nullable: true })
  renameTagId!: string;

  @ManyToMany(() => AssetEntity, (asset) => asset.tags)
  assets!: AssetEntity[];

  @ManyToOne(() => UserEntity, (user) => user.tags)
  user!: UserEntity;
}

export enum TagType {
  /**
   * System generated tag, when renaming, the old tag will be kept
   * and the new tag will be created.
   * The old tag will have the `renameTagId` field set to the new tag i
   */
  OBJECT = 'OBJECT',

  /**
   * System generated tag, when renaming, the old tag will be kept
   * and the new tag will be created.
   * The old tag will have the `renameTagId` field set to the new tag i
   */
  FACE = 'FACES',

  /**
   * User defined tag
   */
  CUSTOM = 'CUSTOM',
}
