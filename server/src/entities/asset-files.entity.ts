import { AssetEntity } from 'src/entities/asset.entity';
import { AssetFileType } from 'src/enum';

export class AssetFileEntity {
  id!: string;
  assetId!: string;
  asset?: AssetEntity;
  createdAt!: Date;
  updatedAt!: Date;
  updateId?: string;
  type!: AssetFileType;
  path!: string;
}
