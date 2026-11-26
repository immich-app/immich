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
    run: (app) => app.viewer.favoriteButton.click(),
    applied: (app) => expect(app.viewer.unfavoriteButton).toBeVisible(),
    sent: (api, { id }) => expect(api.updateAsset).toHaveBeenCalledWith({ params: { id }, body: { isFavorite: true } }),
  },
  archive: {
    run: (app) => app.viewer.archive(),
    applied: (app) => expect(app.toast('added_to_archive')).toBeVisible(),
    sent: (api, { id }) =>
      expect(api.updateAsset).toHaveBeenCalledWith({ params: { id }, body: { visibility: AssetVisibility.Archive } }),
  },
  trash: {
    run: (app) => app.viewer.deleteButton.click(),
    applied: () => Promise.resolve(),
    sent: (api, { id }) => expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [id], force: false } }),
  },
  lock: {
    run: (app) => app.viewer.moveToLockedFolder(),
    applied: () => Promise.resolve(),
    sent: (api, { id }) =>
      expect(api.updateAssets).toHaveBeenCalledWith({ body: { ids: [id], visibility: AssetVisibility.Locked } }),
  },
} satisfies Record<string, Action>;

const rows: Array<{ page: FilteredPage; action: keyof typeof actions; expected: Expected }> = [
  { page: 'favorites', action: 'archive', expected: 'advances' },
  { page: 'favorites', action: 'trash', expected: 'leaves' },
  { page: 'favorites', action: 'lock', expected: 'leaves' },
  { page: 'archive', action: 'favorite', expected: 'stays' },
  { page: 'archive', action: 'trash', expected: 'leaves' },
  { page: 'archive', action: 'lock', expected: 'leaves' },
  { page: 'locked', action: 'favorite', expected: 'stays' },
  { page: 'album', action: 'favorite', expected: 'stays' },
  { page: 'album', action: 'lock', expected: 'leaves' },
  { page: 'person', action: 'favorite', expected: 'stays' },
  { page: 'person', action: 'trash', expected: 'leaves' },
  { page: 'person', action: 'lock', expected: 'leaves' },
  { page: 'tag', action: 'favorite', expected: 'stays' },
  { page: 'tag', action: 'archive', expected: 'advances' },
  { page: 'tag', action: 'trash', expected: 'leaves' },
  { page: 'tag', action: 'lock', expected: 'leaves' },
  { page: 'folder', action: 'favorite', expected: 'stays' },
  { page: 'folder', action: 'archive', expected: 'leaves' },
  { page: 'search', action: 'favorite', expected: 'stays' },
];

for (const { page: name, action, expected } of rows) {
  test(`${action} in the viewer on ${name} ${expected}`, async ({ page, data, api, app }) => {
    const { route, assets } = filteredPages[name](data);
    const [asset, other] = assets;
    await page.goto(route);
    await app.timeline.thumbnail(asset).click();
    await app.viewer.waitForAsset(asset);
    await expect(app.viewer.nextButton).toBeVisible();

    await actions[action].run(app);

    if (expected === 'stays') {
      await actions[action].applied(app);
    }
    const current = expected === 'stays' ? asset : other;
    await expect(page).toHaveURL(new RegExp(`/photos/${current.id}`));
    await app.viewer.waitForAsset(current);
    await app.viewer.backButton.click();
    await expect(app.timeline.thumbnail(other)).toBeVisible();
    await expect(app.timeline.thumbnail(asset)).toHaveCount(expected === 'leaves' ? 0 : 1);
    actions[action].sent(api, asset);
  });
}
