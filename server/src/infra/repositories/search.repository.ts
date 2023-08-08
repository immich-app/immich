import { ISearchRepository, SearchExploreItem } from '@app/domain';
import { AssetEntity } from '../entities';

export class SearchRepository implements ISearchRepository {
  async explore(): Promise<SearchExploreItem<AssetEntity>[]> {
    return [];
  }
}
