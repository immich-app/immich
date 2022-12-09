import { Asset } from './asset';

export interface SmartInfo {
  id: string;
  assetId: string;
  tags: string[] | null;
  objects: string[] | null;
  asset?: Asset;
}
