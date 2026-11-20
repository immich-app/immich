import type { MockData } from '#test/common/data.ts';
import type { App } from '#test/medium/app.ts';
import { filteredPages, type Expected, type FilteredPage } from '#test/medium/filtered-views.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import type { MockNetwork } from '#test/medium/mocks/api.ts';
import { AssetVisibility, type AssetBulkUpdateDto, type AssetResponseDto } from '@immich/sdk';

type Change = {
  emit: (api: MockNetwork, data: MockData, id: string) => void;
  shown?: (app: App, asset: AssetResponseDto) => Promise<void>;
};

const update = (dto: Omit<AssetBulkUpdateDto, 'ids'>) => (api: MockNetwork, data: MockData, id: string) =>
  api.emit('on_asset_update', data.updateAssets({ ids: [id], ...dto }).getAsset(id));

const changes = {
  favorited: {
    emit: update({ isFavorite: true }),
    shown: (app, asset) => expect(app.timeline.favoriteIcon(asset)).toHaveCount(1),
  },
  unfavorited: { emit: update({ isFavorite: false }) },
  archived: {
    emit: update({ visibility: AssetVisibility.Archive }),
    shown: (app, asset) => expect(app.timeline.archiveIcon(asset)).toHaveCount(1),
  },
  unarchived: { emit: update({ visibility: AssetVisibility.Timeline }) },
  trashed: {
    emit: (api, data, id) => {
      data.deleteAssets([id]);
      api.emit('on_asset_trash', [id]);
    },
  },
  deleted: {
    emit: (api, data, id) => {
      data.deleteAssets([id], true);
      api.emit('on_asset_delete', id);
    },
  },
} satisfies Record<string, Change>;

const rows: Array<{ page: FilteredPage; change: keyof typeof changes; expected: Expected }> = [
  { page: 'photos', change: 'archived', expected: 'leaves' },
  { page: 'photos', change: 'deleted', expected: 'leaves' },
  { page: 'favorites', change: 'unfavorited', expected: 'leaves' },
  { page: 'favorites', change: 'trashed', expected: 'leaves' },
  { page: 'archive', change: 'unarchived', expected: 'leaves' },
  { page: 'archive', change: 'favorited', expected: 'stays' },
  { page: 'archive', change: 'trashed', expected: 'leaves' },
  { page: 'album', change: 'archived', expected: 'stays' },
  { page: 'album', change: 'trashed', expected: 'leaves' },
  { page: 'trash', change: 'deleted', expected: 'leaves' },
];

for (const { page: name, change, expected } of rows) {
  test(`${change} on another device on ${name} ${expected}`, async ({ page, data, api, app }) => {
    const { route, assets } = filteredPages[name](data);
    const [asset, other] = assets;
    await page.goto(route);
    await expect(app.timeline.thumbnail(asset)).toBeVisible();

    await expect(() => changes[change].emit(api, data, asset.id)).toPass();

    if (expected === 'stays') {
      await changes[change].shown?.(app, asset);
    }
    await expect(app.timeline.thumbnail(asset)).toHaveCount(expected === 'leaves' ? 0 : 1);
    await expect(app.timeline.thumbnail(other)).toBeVisible();
  });
}
