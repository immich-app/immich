import { AssetEntity } from '@app/infra';

export interface IDeleteFileOnDiskJob {
  assets: AssetEntity[];
}
