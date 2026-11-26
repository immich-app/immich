import DetailPanelDescription from '#lib/components/asset-viewer/DetailPanelDescription.svelte';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';

test('clearing the description saves null', async ({ data, settle, api, app }) => {
  const asset = factory.asset({ exifInfo: { description: 'sunset' } });
  data.addAssets(asset);

  await render(DetailPanelDescription, { asset, isOwner: true });
  await app.assetViewer.descriptionInput.fill('');
  await userEvent.tab();
  await settle();

  expect(api.updateAsset).toHaveBeenCalledWith({ params: { id: asset.id }, body: { description: null } });
});
