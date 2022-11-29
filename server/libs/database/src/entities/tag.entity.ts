import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AssetEntity } from './asset.entity';

@Entity('tags')
@Unique('UQ_unique_tag', ['assetId', 'type', 'tag'])
export class TagEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'uuid' })
  assetId!: string;

  @Column()
  type!: TagType;

  @Column()
  tag!: string;

  @ManyToOne(() => AssetEntity, (asset) => asset.tags, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'assetId' })
  assetInfo!: AssetEntity;
}

export enum TagType {
  // System generated
  OBJECT = 'OBJECT',

  // System generated
  FACE = 'FACES',

  // User defined
  CUSTOM = 'CUSTOM',
}
