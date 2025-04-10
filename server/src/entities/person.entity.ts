import { AssetFaceEntity } from 'src/entities/asset-face.entity';

export class PersonEntity {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  updateId?: string;
  ownerId!: string;
  name!: string;
  birthDate!: Date | string | null;
  thumbnailPath!: string;
  faceAssetId!: string | null;
  faceAsset!: AssetFaceEntity | null;
  faces!: AssetFaceEntity[];
  isHidden!: boolean;
  isFavorite!: boolean;
  color?: string | null;
}
