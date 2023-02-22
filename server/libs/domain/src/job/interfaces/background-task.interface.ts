import { AssetEntity } from '@app/infra/db/entities';

export interface IDeleteFileOnDiskJob {
  assets: AssetEntity[];
}
