import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('deletes a workflow', async ({ data, router, render, settle, api, app }) => {
  const workflow = factory.workflow({ name: 'Favorites' });
  data.addWorkflows(workflow);
  await router.goto(Route.workflows());
  await render(Page, load);
  await settle();

  await app.workflows.menuButton(0).click();
  await app.workflows.deleteMenuItem.click();
  await app.cancelButton.click();
  await settle();

  expect(api.deleteWorkflow).not.toHaveBeenCalled();

  await app.workflows.menuButton(0).click();
  await app.workflows.deleteMenuItem.click();
  await app.confirmButton.click();
  await settle();

  expect(api.deleteWorkflow).toHaveBeenCalledWith({ params: { id: workflow.id } });
});
