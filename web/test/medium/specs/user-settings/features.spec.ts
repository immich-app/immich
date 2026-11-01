import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

for (const sidebarWeb of [undefined, true, false]) {
  test(`Locked Folder sidebar visibility honors preference ${sidebarWeb}`, async ({ page, data }) => {
    data.setPreferences(factory.preferences({ lockedFolder: sidebarWeb === undefined ? undefined : { sidebarWeb } }));
    await page.goto(Route.photos());

    await expect(page.getByRole('link', { name: 'locked_folder', exact: true })).toHaveCount(
      sidebarWeb === false ? 0 : 1,
    );
  });
}

test('Locked Folder sidebar preference updates immediately and persists across reloads', async ({ page, api, app }) => {
  await page.goto(Route.userSettings());
  const shortcut = page.getByRole('link', { name: 'locked_folder', exact: true });
  await expect(shortcut).toBeVisible();
  await app.settings.openSection('features');
  await app.settings.openSection('locked_folder');
  const toggle = page.getByRole('switch', { name: 'sidebar', exact: true });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await page.getByRole('button', { name: 'save', exact: true }).click();

  await expect(shortcut).toHaveCount(0);
  expect(api.updateMyPreferences).toHaveBeenCalledWith({
    body: expect.objectContaining({ lockedFolder: { sidebarWeb: false } }),
  });
  await page.reload();
  await expect(shortcut).toHaveCount(0);
  await app.settings.openSection('features');
  await app.settings.openSection('locked_folder');
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await page.getByRole('button', { name: 'save', exact: true }).click();

  await expect(shortcut).toBeVisible();
  expect(api.updateMyPreferences).toHaveBeenCalledWith({
    body: expect.objectContaining({ lockedFolder: { sidebarWeb: true } }),
  });
});
