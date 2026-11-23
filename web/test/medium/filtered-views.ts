import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { factory } from '#test/common/factories.ts';
import { AssetVisibility, type AssetResponseDto } from '@immich/sdk';

export type Expected = 'leaves' | 'stays' | 'advances';

const alice = factory.person({ name: 'Alice' });
const travel = factory.tag({ name: 'Travel' });

const pair = (data: MockData, overrides: Partial<AssetResponseDto> = {}, visibility?: AssetVisibility) => {
  const assets = [
    factory.asset({ ...overrides, fileCreatedAt: '2026-06-20T12:00:00.000Z' }),
    factory.asset({ ...overrides, fileCreatedAt: '2026-06-10T12:00:00.000Z' }),
  ];
  data.addAssets(assets).updateAssets({ ids: assets.map(({ id }) => id), visibility });
  return assets;
};

export const filteredPages = {
  photos: (data: MockData) => ({ route: Route.photos(), assets: pair(data) }),
  favorites: (data: MockData) => ({ route: Route.favorites(), assets: pair(data, { isFavorite: true }) }),
  archive: (data: MockData) => ({ route: Route.archive(), assets: pair(data, {}, AssetVisibility.Archive) }),
  locked: (data: MockData) => {
    data.setAuthStatus({ pinCode: true, isElevated: true });
    return { route: Route.locked(), assets: pair(data, {}, AssetVisibility.Locked) };
  },
  album: (data: MockData) => {
    const album = factory.album();
    const assets = pair(data);
    data.addAlbums(album).addToAlbum(album.id, assets);
    return { route: Route.viewAlbum(album), assets };
  },
  person: (data: MockData) => {
    data.addPeople(alice);
    return { route: Route.viewPerson(alice), assets: pair(data, { people: [alice] }) };
  },
  tag: (data: MockData) => {
    data.addTags(travel).setPreferences(factory.preferences({ tags: { enabled: true, sidebarWeb: false } }));
    return { route: Route.tags({ path: travel.value }), assets: pair(data, { tags: [travel] }) };
  },
  folder: (data: MockData) => {
    const assets = ['a.jpg', 'b.jpg'].map((name) =>
      factory.asset({ originalPath: `/library/trip/${name}`, originalFileName: name }),
    );
    data.addAssets(assets);
    return { route: Route.folders({ path: '/library/trip' }), assets };
  },
  trash: (data: MockData) => {
    const assets = pair(data);
    data.deleteAssets(assets.map(({ id }) => id));
    return { route: Route.trash(), assets };
  },
  search: (data: MockData) => ({ route: Route.search({ originalFileName: 'IMG' }), assets: pair(data) }),
  'search archive': (data: MockData) => ({
    route: Route.search({ visibility: AssetVisibility.Archive }),
    assets: pair(data, {}, AssetVisibility.Archive),
  }),
};

export type FilteredPage = keyof typeof filteredPages;
