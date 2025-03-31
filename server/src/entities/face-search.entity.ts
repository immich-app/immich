import { AssetFaceEntity } from 'src/entities/asset-face.entity';

export class FaceSearchEntity {
  face?: AssetFaceEntity;
  faceId!: string;
  embedding!: string;
}
