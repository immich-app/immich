import { AssetEntity } from '@app/infra/db/entities';

export interface IRecycleBinCleanup {
  asset: AssetEntity;
}
