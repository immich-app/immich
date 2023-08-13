import { SearchResult } from '@app/domain';

export const searchStub = {
  emptyResults: Object.freeze<SearchResult<any>>({
    total: 0,
    count: 0,
    page: 1,
    items: [],
    facets: [],
    distances: [],
  }),
};
