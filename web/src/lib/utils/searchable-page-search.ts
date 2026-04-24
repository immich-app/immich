export type SearchablePageSortOrder = 'relevance' | 'asc' | 'desc';

type SearchablePageState = {
  basePath: string | null;
  isSearchable: boolean;
  query: string;
  hasExplicitSort: boolean;
  sortOrder: SearchablePageSortOrder;
};

function getSortOrder(query: string, rawSort: string | null): SearchablePageSortOrder {
  if (rawSort === 'asc' || rawSort === 'desc') {
    return rawSort;
  }
  if (query.length === 0) {
    return 'desc';
  }
  return 'relevance';
}

export function getSearchablePageBasePath(pathname: string): string | null {
  if (pathname.startsWith('/photos')) {
    return '/photos';
  }

  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'spaces' || parts[1] === undefined) {
    return null;
  }

  if (parts.length === 2) {
    return `/spaces/${parts[1]}`;
  }

  if (parts[2] === 'photos') {
    return `/spaces/${parts[1]}/photos`;
  }

  return null;
}

export function getSearchablePageState(url: URL): SearchablePageState {
  const basePath = getSearchablePageBasePath(url.pathname);
  if (!basePath) {
    return {
      basePath: null,
      isSearchable: false,
      query: '',
      hasExplicitSort: false,
      sortOrder: 'desc',
    };
  }

  const query = (url.searchParams.get('q') ?? '').trim();
  const rawSort = url.searchParams.get('sort');
  return {
    basePath,
    isSearchable: true,
    query,
    hasExplicitSort: rawSort === 'asc' || rawSort === 'desc',
    sortOrder: getSortOrder(query, rawSort),
  };
}

export function buildSearchablePageUrl(
  url: URL,
  query: string,
  sortOrder: SearchablePageSortOrder = 'relevance',
): string | null {
  const basePath = getSearchablePageBasePath(url.pathname);
  if (!basePath) {
    return null;
  }

  const trimmedQuery = query.trim();
  const params = new URLSearchParams(url.searchParams);

  if (trimmedQuery) {
    params.set('q', trimmedQuery);
    if (sortOrder === 'relevance') {
      params.delete('sort');
    } else {
      params.set('sort', sortOrder);
    }
  } else {
    params.delete('q');
    if (sortOrder === 'asc' || sortOrder === 'desc') {
      params.set('sort', sortOrder);
    } else {
      params.delete('sort');
    }
  }

  const search = params.toString();
  return basePath + (search ? `?${search}` : '');
}
