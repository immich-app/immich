import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { factory } from '#test/common/factories.ts';
import type { OperationId } from '#test/common/types.ts';
import type { App } from '#test/medium/app.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import type { AssetResponseDto } from '@immich/sdk';

type Row = {
  action: string;
  operation: OperationId;
  toast: string;
  trashed?: boolean;
  run: (app: App) => Promise<void>;
};

const rows: Row[] = [
  {
    action: 'favorite',
    operation: 'updateAsset',
    toast: 'errors.unable_to_add_remove_favorites',
    run: (app) => app.viewer.favoriteButton.click(),
  },
  {
    action: 'archive',
    operation: 'updateAsset',
    toast: 'errors.unable_to_add_remove_archive',
    run: (app) => app.viewer.archive(),
  },
  {
    action: 'rating',
    operation: 'updateAsset',
    toast: 'errors.cant_apply_changes',
    run: async (app) => {
      await app.viewer.openDetailPanel();
      await app.viewer.ratingStar(5).click();
    },
  },
  {
    action: 'description',
    operation: 'updateAsset',
    toast: 'cannot_update_the_description',
    run: async (app) => {
      await app.viewer.openDetailPanel();
      await app.viewer.description.fill('new description');
      await app.viewer.description.blur();
    },
  },
  {
    action: 'location',
    operation: 'updateAsset',
    toast: 'errors.unable_to_change_location',
    run: async (app) => {
      await app.viewer.openDetailPanel();
      await app.viewer.addLocationButton.click();
      await app.viewer.changeLocation.latitudeInput.fill('10');
      await app.viewer.changeLocation.longitudeInput.fill('20');
      await app.viewer.changeLocation.confirmButton.click();
    },
  },
  {
    action: 'date',
    operation: 'updateAsset',
    toast: 'errors.unable_to_change_date',
    run: async (app) => {
      await app.viewer.openDetailPanel();
      await app.viewer.editDateButton.click();
      await app.viewer.changeDate.dateInput.fill('2025-12-01T12:00');
      await app.viewer.changeDate.confirmButton.click();
    },
  },
  {
    action: 'lock',
    operation: 'updateAssets',
    toast: 'errors.unable_to_save_settings',
    run: (app) => app.viewer.moveToLockedFolder(),
  },
  {
    action: 'trash',
    operation: 'deleteAssets',
    toast: 'errors.unable_to_delete_assets',
    run: (app) => app.viewer.deleteButton.click(),
  },
  {
    action: 'permanent delete',
    operation: 'deleteAssets',
    toast: 'errors.unable_to_delete_asset',
    trashed: true,
    run: (app) => app.viewer.permanentlyDelete(),
  },
  {
    action: 'restore',
    operation: 'restoreAssets',
    toast: 'errors.unable_to_restore_assets',
    trashed: true,
    run: (app) => app.viewer.restore(),
  },
];

const setup = (data: MockData, { trashed }: Row) => {
  const asset = factory.asset({ exifInfo: { rating: 3 } });
  data.setPreferences(factory.preferences({ ratings: { enabled: true } })).addAssets(asset);
  if (trashed) {
    data.deleteAssets([asset.id]);
  }
  return asset;
};

const viewRoute = (asset: AssetResponseDto, { trashed }: Row) =>
  trashed ? Route.viewTrashedAsset({ id: asset.id }) : Route.viewAsset({ id: asset.id });

test.describe('asset viewer failures', () => {
  for (const row of rows) {
    test(`a failed ${row.action} shows ${row.toast}`, async ({ page, data, api, logger, app }) => {
      const asset = setup(data, row);
      api.on({ [row.operation]: () => ({ networkError: true }) });
      await page.goto(viewRoute(asset, row));
      await app.viewer.waitForAsset(asset);

      await row.run(app);

      await expect(app.toast(row.toast)).toBeVisible();
      expect(api[row.operation]).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(/handleError/);
      expect(logger.error).toHaveBeenCalledWith(/ERR_FAILED/);
    });
  }
});
