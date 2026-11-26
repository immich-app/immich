import { queryClient } from '#lib/queries/client.ts';
import { getAllSharedLinksQuery } from '#lib/queries/shared-link.query.ts';
import { Route } from '#lib/route.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('clearing the description and password saves null', async ({ data, router, render, settle, api, app }) => {
  const sharedLink = factory.sharedLink({ description: 'Trip', password: 'secret' });
  data.addSharedLinks(sharedLink);
  api.on({ updateSharedLink: () => ({ json: sharedLink }) });
  await queryClient.query(getAllSharedLinksQuery());
  await router.goto(Route.editSharedLink(sharedLink), { id: sharedLink.id });
  await render(Page, load);
  await settle();

  await app.sharedLinkForm.descriptionInput.fill('');
  await app.sharedLinkForm.passwordInput.fill('');
  await app.dialogButton('confirm').click();
  await settle();

  expect(api.updateSharedLink).toHaveBeenCalledWith({
    params: { id: sharedLink.id },
    body: expect.objectContaining({ description: null, password: null }),
  });
});
