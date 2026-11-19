import WorkflowLogsModal from '#lib/modals/WorkflowLogsModal.svelte';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { WorkflowResult } from '@immich/sdk';
import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

test('lists the workflow runs', async ({ data, settle, api, app }) => {
  const workflow = factory.workflow({ logging: true });
  data.addWorkflows(workflow).addWorkflowLogs(workflow.id, [
    factory.workflowLog({ at: '2026-03-03T12:00:00.000Z', result: WorkflowResult.Completed }),
    factory.workflowLog({
      at: '2026-03-02T12:00:00.000Z',
      result: WorkflowResult.Halted,
      lastStep: { index: 1, method: 'plugin#filter' },
    }),
    factory.workflowLog({ at: '2026-03-01T12:00:00.000Z', result: WorkflowResult.Error }),
  ]);

  await render(WorkflowLogsModal, { workflow, onClose: vi.fn() });
  await settle();

  expect(api.getWorkflowLogs).toHaveBeenCalledWith({ params: { id: workflow.id, limit: 50 } });
  await expect.element(app.workflowLogs.result('workflow_logging_completed')).toBeVisible();
  await expect.element(app.workflowLogs.result('workflow_logging_halted_step')).toBeVisible();
  await expect.element(app.workflowLogs.result('error')).toBeVisible();
  await expect.element(app.workflowLogs.loadingRow).not.toBeInTheDocument();
});

test('filters the runs by result', async ({ data, settle, api, app }) => {
  const workflow = factory.workflow({ logging: true });
  data
    .addWorkflows(workflow)
    .addWorkflowLogs(workflow.id, [
      factory.workflowLog({ at: '2026-03-02T12:00:00.000Z', result: WorkflowResult.Completed }),
      factory.workflowLog({ at: '2026-03-01T12:00:00.000Z', result: WorkflowResult.Error }),
    ]);
  await render(WorkflowLogsModal, { workflow, onClose: vi.fn() });
  await settle();

  await app.workflowLogs.filter('error');
  await settle();

  expect(api.getWorkflowLogs).toHaveBeenCalledWith({ params: { id: workflow.id, result: 'error', limit: 50 } });
  await expect.element(app.workflowLogs.result('error')).toBeVisible();
  await expect.element(app.workflowLogs.result('workflow_logging_completed')).not.toBeInTheDocument();
});

test('turns on logging', async ({ data, settle, api, app }) => {
  const workflow = factory.workflow({ logging: false });
  data.addWorkflows(workflow);
  await render(WorkflowLogsModal, { workflow, onClose: vi.fn() });

  await app.workflowLogs.enableButton.click();
  await settle();

  expect(api.updateWorkflow).toHaveBeenCalledWith({ params: { id: workflow.id }, body: { logging: true } });
  expect(api.getWorkflowLogs).toHaveBeenCalledWith({ params: { id: workflow.id, limit: 50 } });
  await expect.element(app.workflowLogs.disableButton).toBeVisible();
});

test('turns off logging', async ({ data, settle, api, app }) => {
  const workflow = factory.workflow({ logging: true });
  data.addWorkflows(workflow);
  await render(WorkflowLogsModal, { workflow, onClose: vi.fn() });
  await settle();

  await app.workflowLogs.disableButton.click();
  await settle();

  expect(api.updateWorkflow).toHaveBeenCalledWith({ params: { id: workflow.id }, body: { logging: false } });
  await expect.element(app.workflowLogs.enableButton).toBeVisible();
});
