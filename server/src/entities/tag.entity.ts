import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';
import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('tags')
@Unique('UQ_tag_name_userId', ['name', 'userId'])
export class TagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type!: TagType;

  @Column()
  name!: string;

  @ManyToOne(() => UserEntity, (user) => user.tags)
  user!: UserEntity;

  @Column()
  userId!: string;

  @Column({ type: 'uuid', comment: 'The new renamed tagId', nullable: true })
  renameTagId!: string | null;

  @ManyToMany(() => AssetEntity, (asset) => asset.tags)
  assets!: AssetEntity[];
}

export enum TagType {
  /**
   * Tag that is detected by the ML model for object detection will use this type
   */
  OBJECT = 'OBJECT',

  /**
   * Face that is detected by the ML model for facial detection (TBD/NOT YET IMPLEMENTED) will use this type
   */
  FACE = 'FACE',

  /**
   * Tag that is created by the user will use this type
   */
  CUSTOM = 'CUSTOM',
}
