import type { NonAttribute } from 'kysely-typeorm';
import { AssetEntity } from 'src/entities/asset.entity';
import { MemoryEntity } from 'src/entities/memory.entity';
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('memories_assets_assets')
export class MemoryAssetEntity {
  @PrimaryColumn('uuid')
  @Index('IDX_984e5c9ab1f04d34538cd32334')
  memoriesId!: string;

  @ManyToOne(() => MemoryEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'memoriesId' })
  memory!: NonAttribute<MemoryEntity>;

  @PrimaryColumn('uuid')
  @Index('IDX_6942ecf52d75d4273de19d2c16')
  assetsId!: string;

  @ManyToOne(() => AssetEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'assetsId' })
  asset!: NonAttribute<AssetEntity>;
}
