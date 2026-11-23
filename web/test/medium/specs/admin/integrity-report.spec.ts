import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { IntegrityReport } from '@immich/sdk';

test('downloads an integrity report item', async ({ page, data, api, app }) => {
  const reportType = IntegrityReport.ChecksumMismatch;
  const item = factory.integrityReportItem({ type: reportType, path: '/data/library/photo.jpg' });
  data.addIntegrityReportItems(item);
  await page.goto(Route.systemMaintenanceIntegrityReport({ reportType }));

  await app.admin.integrityReport.rowMenuButton(item.path).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    app.admin.integrityReport.downloadMenuItem.click(),
  ]);

  expect(download.suggestedFilename()).toBe('photo.jpg');
  expect(api.getIntegrityReportFile).toHaveBeenCalledWith({ params: { id: item.id } });
});

test('downloads the integrity report as csv', async ({ page, api, app }) => {
  const reportType = IntegrityReport.MissingFile;
  await page.goto(Route.systemMaintenanceIntegrityReport({ reportType }));

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    app.admin.integrityReport.downloadCsvButton.click(),
  ]);

  expect(download.suggestedFilename()).toBe('missing_file.csv');
  expect(api.getIntegrityReportCsv).toHaveBeenCalledWith({ params: { $type: reportType } });
});
