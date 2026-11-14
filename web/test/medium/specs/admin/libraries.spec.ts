import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test.describe('library administration', () => {
  test('deletes a library with assets', async ({ page, data, api, app }) => {
    const library = factory.library({ name: 'Photos', assetCount: 3 });
    data.addLibraries(library);
    await page.goto(Route.viewLibrary(library));

    await app.library.deleteButton.click();
    await app.dialogButton('cancel').click();
    await expect(app.dialog).toBeHidden();

    await app.library.deleteButton.click();
    await app.dialogButton('confirm').click();
    await app.dialogButton('cancel').click();
    await expect(app.dialog).toBeHidden();
    expect(api.deleteLibrary).not.toHaveBeenCalled();

    await app.library.deleteButton.click();
    await app.dialogButton('confirm').click();
    await app.dialogButton('confirm').click();

    await expect(page).toHaveURL(Route.libraries());
    expect(api.deleteLibrary).toHaveBeenCalledWith({ params: { id: library.id } });
  });

  test('removes an import folder', async ({ page, data, api, app }) => {
    const library = factory.library({ importPaths: ['/photos', '/videos'] });
    data.addLibraries(library);
    await page.goto(Route.viewLibrary(library));

    await app.library.rowDeleteButton('/videos').click();
    await app.dialogButton('cancel').click();
    await expect(app.dialog).toBeHidden();
    expect(api.updateLibrary).not.toHaveBeenCalled();

    await app.library.rowDeleteButton('/videos').click();
    await app.dialogButton('remove').click();

    await expect(app.library.rowDeleteButton('/videos')).toHaveCount(0);
    expect(api.updateLibrary).toHaveBeenCalledWith({ params: { id: library.id }, body: { importPaths: ['/photos'] } });
  });

  test('removes an exclusion pattern', async ({ page, data, api, app }) => {
    const library = factory.library({ exclusionPatterns: ['**/@eaDir/**', '**/.trash/**'] });
    data.addLibraries(library);
    await page.goto(Route.viewLibrary(library));

    await app.library.rowDeleteButton('**/.trash/**').click();
    await app.dialogButton('cancel').click();
    await expect(app.dialog).toBeHidden();
    expect(api.updateLibrary).not.toHaveBeenCalled();

    await app.library.rowDeleteButton('**/.trash/**').click();
    await app.dialogButton('confirm').click();

    await expect(app.library.rowDeleteButton('**/.trash/**')).toHaveCount(0);
    expect(api.updateLibrary).toHaveBeenCalledWith({
      params: { id: library.id },
      body: { exclusionPatterns: ['**/@eaDir/**'] },
    });
  });
});
