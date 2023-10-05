import { SearchResult } from '@app/domain';
import { AssetEntity } from '@app/infra/entities';
import { assetStub } from '.';

export const searchStub = {
  emptyResults: Object.freeze<SearchResult<any>>({
    total: 0,
    count: 0,
    page: 1,
    items: [],
    facets: [],
    distances: [],
  }),

  withImage: Object.freeze<SearchResult<AssetEntity>>({
    total: 1,
    count: 1,
    page: 1,
    items: [assetStub.image],
    facets: [],
    distances: [],
  }),
};
