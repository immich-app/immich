import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import type { Mock } from '#test/unit/mocks/mock.ts';
import type { PersonResponseDto } from '@immich/sdk';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

const alice = factory.person({ name: 'Alice', isHidden: false });
const bob = factory.person({ name: 'Bob', isHidden: false });
const carol = factory.person({ name: 'Carol', isHidden: true });

const twoPages = (api: Mock['api'], secondPage: () => Promise<void>) =>
  api.on({
    getAllPeople: async ({ params = {} }) => {
      if (params.page === 2) {
        await secondPage();
        return pageOf([carol], false);
      }
      return pageOf([alice, bob], true);
    },
  });

const pageOf = (people: PersonResponseDto[], hasNextPage: boolean) => ({
  json: { people, total: 3, hidden: 1, hasNextPage },
});

test('keeps toggled hidden state when loading more people', async ({ api, render, settle, app }) => {
  let release = () => {};
  twoPages(api, () => new Promise<void>((resolve) => (release = resolve)));
  await render(Page, load);

  await app.people.manage.hideButtons.first().click();
  release();
  await settle();

  await expect.element(app.people.manage.hidden.nth(1)).toBeVisible();
  await expect.element(app.people.manage.hidden.first().getByText('Alice')).toBeVisible();
  await expect.element(app.people.manage.hidden.nth(1).getByText('Carol')).toBeVisible();
});

test('shows newly loaded hidden people as hidden', async ({ api, render, settle, app }) => {
  twoPages(api, () => Promise.resolve());
  await render(Page, load);
  await app.people.manage.hideButtons.last().hover();
  await settle();

  await expect.element(app.people.manage.hidden.first().getByText('Carol')).toBeVisible();
  expect(app.people.manage.hidden.elements()).toHaveLength(1);
});

test('done saves only the people whose visibility changed', async ({ api, render, settle, app }) => {
  twoPages(api, () => Promise.resolve());
  await render(Page, load);
  await settle();

  await app.people.manage.hideButtons.first().click();
  await app.people.manage.doneButton.click();
  await settle();

  expect(api.updatePeople).toHaveBeenCalledWith({ body: { people: [{ id: alice.id, isHidden: true }] } });
});
