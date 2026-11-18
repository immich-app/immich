import AssetMoveToLibraryModal from '#lib/modals/AssetMoveToLibraryModal.svelte';
import { factory } from '#test/common/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';

const root = '/mnt/external/archivo';

test('browses the folders of the owner library and moves the assets there', async ({ data, api }) => {
  const library = factory.library({ name: 'Archivo', ownerId: data.user.id, importPaths: [root] });
  data.addLibraries([
    library,
    factory.library({ name: 'Otra', ownerId: 'someone-else', importPaths: ['/mnt/external/otra'] }),
  ]);
  api.on({
    getLibraryFolders: ({ params }) => {
      const path = params.path ?? root;
      if (path === root) {
        return { json: { path: root, parentPath: null, folders: [{ name: '2024', path: `${root}/2024` }] } };
      }
      return { json: { path, parentPath: root, folders: [] } };
    },
    moveAssetsToLibrary: () => ({ status: 204 }),
  });
  const onClose = vi.fn();

  await render(AssetMoveToLibraryModal, { assetIds: ['asset-1'], ownerId: data.user.id, onClose });

  await userEvent.click(page.getByRole('button', { name: '2024' }));
  await expect.element(page.getByText('no_subfolders')).toBeVisible();
  await expect.element(page.getByText(`${root}/2024`).last()).toBeVisible();

  await userEvent.fill(page.getByRole('textbox'), 'julio');
  await expect.element(page.getByText(`${root}/2024/julio`)).toBeVisible();

  await userEvent.click(page.getByRole('button', { name: 'move', exact: true }));

  await expect.poll(() => onClose).toHaveBeenCalledWith(true);
  expect(api.moveAssetsToLibrary).toHaveBeenCalledWith(
    expect.objectContaining({
      params: { id: library.id },
      body: { assetIds: ['asset-1'], folder: `${root}/2024/julio` },
    }),
  );
});
