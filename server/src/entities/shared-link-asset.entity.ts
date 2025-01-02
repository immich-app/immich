import type { NonAttribute } from 'kysely-typeorm';
import { AssetEntity } from 'src/entities/asset.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('shared_link__asset')
export class SharedLinkAssetEntity {
  @PrimaryColumn('uuid')
  @Index('IDX_5b7decce6c8d3db9593d6111a6')
  assetsId!: string;

  @ManyToOne(() => AssetEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'assetsId' })
  asset!: NonAttribute<AssetEntity>;

  @PrimaryColumn('uuid')
  @Index('IDX_c9fab4aa97ffd1b034f3d6581a')
  sharedLinksId!: string;

  @ManyToOne(() => SharedLinkEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'sharedLinksId' })
  sharedLink!: NonAttribute<SharedLinkEntity>;
}
