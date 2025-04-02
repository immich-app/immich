import { AssetEntity } from 'src/entities/asset.entity';
import { FaceSearchEntity } from 'src/entities/face-search.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { SourceType } from 'src/enum';

export class AssetFaceEntity {
  id!: string;
  assetId!: string;
  personId!: string | null;
  faceSearch?: FaceSearchEntity;
  imageWidth!: number;
  imageHeight!: number;
  boundingBoxX1!: number;
  boundingBoxY1!: number;
  boundingBoxX2!: number;
  boundingBoxY2!: number;
  sourceType!: SourceType;
  asset!: AssetEntity;
  person!: PersonEntity | null;
  deletedAt!: Date | null;
}
