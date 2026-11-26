import type { App } from '#test/medium/app.ts';
import { filteredPages, type Expected, type FilteredPage } from '#test/medium/filtered-views.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import type { MockNetwork } from '#test/medium/mocks/api.ts';
import { AssetVisibility, type AssetResponseDto } from '@immich/sdk';

type Action = {
  run: (app: App) => Promise<void>;
  applied: (app: App) => Promise<void>;
  sent: (api: MockNetwork, asset: AssetResponseDto) => void;
};

const actions = {
  favorite: {
    run: (app) => app.timeline.selectionBar.favoriteButton.click(),
    applied: (app) => expect(app.toast('added_to_favorites_count')).toBeVisible(),
    sent: (api, { id }) => expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [id], isFavorite: true } }),
  },
  archive: {
    run: (app) => app.timeline.selectionBar.archive(),
    applied: (app) => expect(app.toast('archived_count')).toBeVisible(),
    sent: (api, { id }) =>
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [id], visibility: AssetVisibility.Archive } }),
  },
  unarchive: {
    run: (app) => app.timeline.selectionBar.unarchive(),
    applied: (app) => expect(app.toast('unarchived_count')).toBeVisible(),
    sent: (api, { id }) =>
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [id], visibility: AssetVisibility.Timeline } }),
  },
  trash: {
    run: (app) => app.timeline.selectionBar.trash(),
    applied: () => Promise.resolve(),
    sent: (api, { id }) => expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [id], force: false } }),
  },
  lock: {
    run: (app) => app.timeline.selectionBar.moveToLockedFolder(),
    applied: () => Promise.resolve(),
    sent: (api, { id }) =>
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [id], visibility: AssetVisibility.Locked } }),
  },
} satisfies Record<string, Action>;

const rows: Array<{ page: FilteredPage; action: keyof typeof actions; expected: Expected }> = [
  { page: 'favorites', action: 'archive', expected: 'stays' },
  { page: 'favorites', action: 'trash', expected: 'leaves' },
  { page: 'favorites', action: 'lock', expected: 'leaves' },
  { page: 'archive', action: 'trash', expected: 'leaves' },
  { page: 'archive', action: 'lock', expected: 'leaves' },
  { page: 'album', action: 'lock', expected: 'leaves' },
  { page: 'person', action: 'favorite', expected: 'stays' },
  { page: 'person', action: 'archive', expected: 'leaves' },
  { page: 'person', action: 'trash', expected: 'leaves' },
  { page: 'person', action: 'lock', expected: 'leaves' },
  { page: 'tag', action: 'favorite', expected: 'stays' },
  { page: 'tag', action: 'archive', expected: 'stays' },
  { page: 'tag', action: 'trash', expected: 'leaves' },
  { page: 'tag', action: 'lock', expected: 'leaves' },
  { page: 'folder', action: 'archive', expected: 'leaves' },
  { page: 'folder', action: 'lock', expected: 'leaves' },
  { page: 'folder', action: 'trash', expected: 'leaves' },
  { page: 'search', action: 'favorite', expected: 'stays' },
  { page: 'search', action: 'archive', expected: 'leaves' },
  { page: 'search', action: 'lock', expected: 'leaves' },
  { page: 'search archive', action: 'unarchive', expected: 'leaves' },
];

for (const { page: name, action, expected } of rows) {
  test(`${action} from a selection on ${name} ${expected}`, async ({ page, data, api, app }) => {
    const { route, assets } = filteredPages[name](data);
    const [asset, other] = assets;
    await page.goto(route);
    await app.timeline.select(asset);

    await actions[action].run(app);

    if (expected === 'stays') {
      await actions[action].applied(app);
    }
    await expect(app.timeline.thumbnail(asset)).toHaveCount(expected === 'leaves' ? 0 : 1);
    await expect(app.timeline.thumbnail(other)).toBeVisible();
    actions[action].sent(api, asset);
  });
}
