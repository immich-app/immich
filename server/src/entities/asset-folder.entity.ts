import { AssetEntity } from 'src/entities/asset.entity';
import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('asset_folders')
export class AssetFolderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToMany(() => AssetEntity, (asset) => asset.folder)
  asset?: AssetEntity;

  @Index('idx_asset_folders_path', { unique: true })
  @Column()
  path!: string;
}
