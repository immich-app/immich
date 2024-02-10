import { SearchResult } from '@app/domain';
import { AssetEntity, ExifEntity, SmartInfoEntity } from '@app/infra/entities';
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

  exif: Object.freeze<Partial<ExifEntity>>({
    latitude: 90,
    longitude: 90,
    city: 'Immich',
    state: 'Nebraska',
    country: 'United States',
    make: 'Canon',
    model: 'EOS Rebel T7',
    lensModel: 'Fancy lens',
  }),

  smartInfo: Object.freeze<Partial<SmartInfoEntity>>({ objects: ['car', 'tree'], tags: ['accident'] }),
};
