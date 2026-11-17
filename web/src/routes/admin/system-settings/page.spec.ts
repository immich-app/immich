import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { describe, expect } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import Page from './+page.svelte';
import { load } from './+page.ts';

describe('user settings', () => {
  test.beforeEach(async ({ router, render, app }) => {
    await router.goto(Route.systemSettings());
    await render(Page, load);
    await app.admin.settings.open('admin.user_settings');
    await expect.element(app.admin.settings.numberInput).toHaveValue(7);
  });

  test('a number setting below its minimum snaps to the minimum on blur', async ({ app }) => {
    await app.admin.settings.numberInput.fill('0');
    await userEvent.tab();

    await expect.element(app.admin.settings.numberInput).toHaveValue(1);
  });

  test('a number setting can be emptied while editing', async ({ app }) => {
    await app.admin.settings.numberInput.clear();
    await expect.element(app.admin.settings.numberInput).toHaveValue(null);

    await userEvent.tab();
    await expect.element(app.admin.settings.numberInput).toHaveValue(null);
  });
});

describe('transcoding settings', () => {
  test('the target codecs stay accepted and cannot be unchecked', async ({ router, render, app }) => {
    await router.goto(Route.systemSettings());
    await render(Page, load);

    await app.admin.settings.open('admin.transcoding_settings');
    await app.admin.settings.open('admin.transcoding_policy');

    for (const name of ['H.264', 'AAC']) {
      const checkbox = page.getByRole('checkbox', { name, exact: true });
      await expect.element(checkbox).toBeChecked();
      await expect.element(checkbox).toBeDisabled();
    }
  });
});

describe('authentication settings', () => {
  test('unlinks all OAuth accounts after confirmation', async ({ data, router, render, settle, api, app }) => {
    data.adminConfig.oauth.enabled = true;
    await router.goto(Route.systemSettings());
    await render(Page, load);
    await app.admin.settings.open('admin.authentication_settings');
    await app.admin.settings.open('admin.oauth_settings');

    await app.admin.settings.unlinkAllOAuthAccountsButton.click();
    await app.cancelButton.click();
    await settle();

    expect(api.unlinkAllOAuthAccountsAdmin).not.toHaveBeenCalled();

    await app.admin.settings.unlinkAllOAuthAccountsButton.click();
    await app.confirmButton.click();
    await settle();

    expect(api.unlinkAllOAuthAccountsAdmin).toHaveBeenCalled();
  });
});

describe('storage template settings', () => {
  test('shows the previews rendered by the server', async ({ data, router, render, api, app }) => {
    data.adminConfig.storageTemplate.enabled = true;
    data.adminConfig.storageTemplate.template = '{{y}}/{{filename}}';
    api.on({
      getAdminStorageTemplateOptions: () => ({
        json: {
          yearOptions: ['y'],
          monthOptions: ['MM'],
          weekOptions: ['W'],
          dayOptions: ['dd'],
          hourOptions: ['HH'],
          minuteOptions: ['mm'],
          secondOptions: ['ss'],
          presets: [{ template: '{{y}}/{{filename}}', preview: '2022/IMAGE_56437' }],
        },
      }),
      previewStorageTemplate: ({ body }) => ({ json: { preview: `preview of ${body.template}` } }),
    });
    await router.goto(Route.systemSettings());
    await render(Page, load);
    await app.admin.settings.open('admin.storage_template_settings');

    await expect.element(page.getByRole('option', { name: '2022/IMAGE_56437' })).toBeInTheDocument();
    await expect.element(page.getByRole('combobox', { name: 'preset' })).toHaveValue('{{y}}/{{filename}}');
    await expect.element(page.getByText(/preview of \{\{y\}\}\/\{\{filename\}\}\.jpg$/)).toBeVisible();

    await page.getByRole('textbox', { name: 'template' }).fill('{{y}}/{{MM}}');

    await expect.element(page.getByText(/preview of \{\{y\}\}\/\{\{MM\}\}\.jpg$/)).toBeVisible();
    expect(api.previewStorageTemplate).toHaveBeenCalledWith({ body: { template: '{{y}}/{{MM}}' } });
    await expect.element(page.getByRole('combobox', { name: 'preset' })).not.toHaveValue('{{y}}/{{filename}}');
  });
});
