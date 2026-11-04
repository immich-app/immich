import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { IntegrityReport, ManualJobName } from '@immich/sdk';

test('check all queues the integrity jobs and refreshes the report', async ({ page, data, api, app }) => {
  const { checkAllButton, reportCount } = app.admin.maintenance;
  const untrackedCount = reportCount(IntegrityReport.UntrackedFile);

  await page.goto(Route.systemMaintenance());
  await expect(page).toHaveTitle(/admin\.maintenance_settings/);
  await expect(untrackedCount).toHaveText(/^0+\s*$/);
  await page.waitForResponse(/\/api\/jobs$/);

  await checkAllButton.click();
  await expect(checkAllButton).toBeDisabled();
  expect(api.createJob).toHaveBeenCalledWith({ body: { name: ManualJobName.IntegrityUntrackedFiles } });
  expect(api.createJob).toHaveBeenCalledWith({ body: { name: ManualJobName.IntegrityMissingFiles } });
  expect(api.createJob).toHaveBeenCalledWith({ body: { name: ManualJobName.IntegrityChecksumMismatch } });

  data.updateIntegrityReport({ untracked_file: 1 });
  await expect(untrackedCount).toHaveText(/^0+1\s*$/);
  await expect(checkAllButton).toBeEnabled();
});
