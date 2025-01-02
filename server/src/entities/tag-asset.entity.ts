import { NonAttribute } from 'kysely-typeorm';
import { AssetEntity } from 'src/entities/asset.entity';
import { TagEntity } from 'src/entities/tag.entity';
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('tag_asset')
@Index('IDX_tag_asset_assetsId_tagsId', ['assetsId', 'tagsId'])
export class TagAssetEntity {
  @Index('IDX_f8e8a9e893cb5c54907f1b798e')
  @PrimaryColumn('uuid')
  assetsId!: string;

  @ManyToOne(() => AssetEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'assetsId' })
  asset!: NonAttribute<AssetEntity>;

  @Index('IDX_e99f31ea4cdf3a2c35c7287eb4')
  @PrimaryColumn('uuid')
  tagsId!: string;

  @ManyToOne(() => TagEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tagsId' })
  tag!: NonAttribute<TagEntity>;
}
