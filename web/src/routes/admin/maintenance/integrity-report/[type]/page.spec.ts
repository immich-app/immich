import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { IntegrityReport, ManualJobName } from '@immich/sdk';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

const reportType = IntegrityReport.MissingFile;

const goto = (router: { goto: (url: string, params: Record<string, string>) => Promise<void> }) =>
  router.goto(Route.systemMaintenanceIntegrityReport({ reportType }), { type: reportType });

test('deletes an integrity report item', async ({ data, router, render, settle, api, app }) => {
  const item = factory.integrityReportItem({ type: reportType });
  data.addIntegrityReportItems(item);
  await goto(router);
  await render(Page, load);

  await app.admin.integrityReport.rowMenuButton(item.path).click();
  await app.admin.integrityReport.deleteMenuItem.click();
  await app.cancelButton.click();
  await settle();

  expect(api.deleteIntegrityReport).not.toHaveBeenCalled();

  await app.admin.integrityReport.rowMenuButton(item.path).click();
  await app.admin.integrityReport.deleteMenuItem.click();
  await app.dialogButton('delete').click();
  await settle();

  expect(api.deleteIntegrityReport).toHaveBeenCalledWith({ params: { id: item.id } });
  await expect.element(app.admin.integrityReport.row(item.path)).not.toBeInTheDocument();
});

test('deletes all items of the report type', async ({ data, router, render, settle, api, app }) => {
  const item = factory.integrityReportItem({ type: reportType });
  data.addIntegrityReportItems(item);
  await goto(router);
  await render(Page, load);

  await app.admin.integrityReport.deleteAllButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.createJob).not.toHaveBeenCalled();

  await app.admin.integrityReport.deleteAllButton.click();
  await app.dialogButton('delete').click();
  await settle();

  expect(api.createJob).toHaveBeenCalledWith({ body: { name: ManualJobName.IntegrityMissingFilesDeleteAll } });
  await expect.element(app.admin.integrityReport.row(item.path)).not.toBeInTheDocument();
});

test('loads the next page of the report', async ({ data, router, render, settle, api, app }) => {
  const items = Array.from({ length: 51 }, () => factory.integrityReportItem({ type: reportType }));
  data.addIntegrityReportItems(items);
  await goto(router);
  await render(Page, load);

  await expect.element(app.admin.integrityReport.row(items[50].path)).not.toBeInTheDocument();

  await app.admin.integrityReport.loadMoreButton.click();
  await settle();

  expect(api.getIntegrityReport).toHaveBeenCalledWith({ params: { $type: reportType, cursor: items[50].id } });
  await expect.element(app.admin.integrityReport.row(items[50].path)).toBeVisible();
  await expect.element(app.admin.integrityReport.loadMoreButton).not.toBeInTheDocument();
});
