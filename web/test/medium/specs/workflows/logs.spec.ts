import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('loads older workflow runs when scrolled to the end', async ({ page, data, api, app }) => {
  const workflow = factory.workflow({ name: 'Favorites', logging: true });
  const days = Array.from({ length: 51 }, (_, index) => new Date(Date.UTC(2026, 0, 51 - index)).toISOString());
  data.addWorkflows(workflow).addWorkflowLogs(
    workflow.id,
    days.map((at) => factory.workflowLog({ at })),
  );
  await page.goto(Route.workflows());
  await app.workflows.openLogs();
  await expect(app.workflows.logs.run('Feb 20, 2026, 12:00 AM')).toBeVisible();

  await app.workflows.logs.loadingRow.scrollIntoViewIfNeeded();

  await expect(app.workflows.logs.run('Jan 1, 2026, 12:00 AM')).toBeVisible();
  await expect(app.workflows.logs.loadingRow).toBeHidden();
  expect(api.getWorkflowLogs).toHaveBeenCalledWith({ params: { id: workflow.id, limit: 50 } });
  expect(api.getWorkflowLogs).toHaveBeenCalledWith({
    params: { id: workflow.id, before: '2026-01-02T00:00:00.000Z', limit: 50 },
  });
});
