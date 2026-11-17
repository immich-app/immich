import { Route } from '#lib/route.ts';
import type { MockData } from '#test/common/data.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import type { MockRouter } from '#test/unit/mocks/router.ts';
import { describe, expect } from 'vitest';
import { page } from 'vitest/browser';
import Page from './+page.svelte';
import { load } from './+page.ts';

const favoriteStep = { method: 'immich#favorite', config: null, enabled: true };

const setup = async (data: MockData, router: MockRouter) => {
  data.addPluginMethods(factory.pluginMethod({ key: favoriteStep.method, title: 'Mark as favorite' }));
  const workflow = factory.workflow({ name: 'Favorites', steps: [favoriteStep] });
  data.addWorkflows(workflow);
  await router.goto(Route.viewWorkflow(workflow), { workflowId: workflow.id });
  return workflow;
};

describe('workflow page', () => {
  test('json view leaves out local step ids', async ({ data, router, render }) => {
    await setup(data, router);
    await render(Page, load);

    await page.getByRole('button', { name: 'JSON', exact: true }).click();

    await expect.element(page.getByText(/immich#favorite/).first()).toBeVisible();
    await expect.element(page.getByText(/step-\d/)).not.toBeInTheDocument();
  });

  test('duplicating sends the steps without local ids', async ({ data, router, render, settle, api }) => {
    await setup(data, router);
    await render(Page, load);

    await page.getByRole('button', { name: 'duplicate', exact: true }).click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    await settle();

    expect(api.createWorkflow).toHaveBeenCalledWith({
      body: expect.objectContaining({ steps: [favoriteStep] }),
    });
  });

  test('saving a change hides the save button', async ({ data, router, render, settle, api }) => {
    const workflow = await setup(data, router);
    await render(Page, load);

    await page.getByPlaceholder('workflow_name').fill('Renamed');
    await page.getByRole('button', { name: 'save', exact: true }).click();
    await settle();

    expect(api.updateWorkflow).toHaveBeenCalledWith({
      params: { id: workflow.id },
      body: expect.objectContaining({ name: 'Renamed' }),
    });
    await expect.element(page.getByRole('button', { name: 'save', exact: true })).not.toBeInTheDocument();
  });
});
