import { AssetEntity } from 'src/entities/asset.entity';

export class AssetJobStatusEntity {
  asset!: AssetEntity;
  assetId!: string;
  facesRecognizedAt!: Date | null;
  metadataExtractedAt!: Date | null;
  duplicatesDetectedAt!: Date | null;
  previewAt!: Date | null;
  thumbnailAt!: Date | null;
}
