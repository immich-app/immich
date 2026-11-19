import { featureFlagsManager } from '#lib/managers/feature-flags-manager.svelte.ts';
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

describe('storage template previews', () => {
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

describe('storage template settings', () => {
  test.beforeEach(async ({ router, render, app }) => {
    await router.goto(Route.systemSettings());
    await render(Page, load);
    await app.admin.settings.open('admin.storage_template_settings');
  });

  test('previews the date template', async ({ api, app }) => {
    await app.admin.settings.storageTemplate.option('YYYY/MM/DD').click();

    await expect
      .element(app.admin.settings.text('UPLOAD_LOCATION/library/admin/2022/02/03/IMAGE_56437.jpg'))
      .toBeVisible();
    expect(api.getAdminStorageTemplateOptions).toHaveBeenCalled();
    expect(api.updateAdminConfig).not.toHaveBeenCalled();
  });

  test('previews a custom preset', async ({ app }) => {
    await app.admin.settings.storageTemplate.option('admin.storage_template_option_custom').click();

    await app.admin.settings.storageTemplate.presetSelect.selectOptions('2022/February/IMAGE_56437');

    await expect
      .element(app.admin.settings.text('UPLOAD_LOCATION/library/admin/2022/February/IMAGE_56437.jpg'))
      .toBeVisible();
  });

  test('saves the date template', async ({ settle, api, app }) => {
    await app.admin.settings.storageTemplate.option('YYYY/MM/DD').click();

    await app.admin.settings.saveButton.click();
    await settle();

    expect(api.updateAdminConfig).toHaveBeenCalledWith({
      body: expect.objectContaining({
        storageTemplate: { enabled: true, hashVerificationEnabled: true, template: '{{y}}/{{MM}}/{{dd}}/{{filename}}' },
      }),
    });
  });

  test('keeps the selected template when saving fails', async ({ settle, api, logger, app }) => {
    api.on({ updateAdminConfig: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
    await app.admin.settings.storageTemplate.option('YYYY/MM/DD').click();

    await app.admin.settings.saveButton.click();
    await settle();

    expect(api.updateAdminConfig).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(/handleError/);
    await expect.element(app.admin.settings.storageTemplate.option('YYYY/MM/DD')).toBeChecked();
  });
});

describe('storage template settings with a custom template', () => {
  const customTemplate = { enabled: true, hashVerificationEnabled: true, template: '{{y}}/{{filename}}' };

  test.beforeEach(async ({ data, router, render, api, app }) => {
    const defaults = structuredClone(data.adminConfig);
    api.on({ getAdminConfigDefaults: () => ({ json: defaults }) });
    data.adminConfig.storageTemplate = structuredClone(customTemplate);
    await router.goto(Route.systemSettings());
    await render(Page, load);
    await app.admin.settings.open('admin.storage_template_settings');
    await expect
      .element(app.admin.settings.storageTemplate.option('admin.storage_template_option_custom'))
      .toBeChecked();
  });

  test('selects no template after a reset to default', async ({ settle, api, app }) => {
    await app.admin.settings.resetToDefaultButton.click();

    await expect.element(app.admin.settings.storageTemplate.option('admin.storage_template_option_none')).toBeChecked();

    await app.admin.settings.saveButton.click();
    await settle();

    expect(api.updateAdminConfig).toHaveBeenCalledWith({
      body: expect.objectContaining({ storageTemplate: expect.objectContaining({ enabled: false }) }),
    });
    await expect.element(app.admin.settings.storageTemplate.option('admin.storage_template_option_none')).toBeChecked();
  });

  test('selects the saved custom template after a reset', async ({ app }) => {
    await app.admin.settings.storageTemplate.option('YYYY/MM/DD').click();

    await app.admin.settings.resetButton.click();

    await expect
      .element(app.admin.settings.storageTemplate.option('admin.storage_template_option_custom'))
      .toBeChecked();
    await expect.element(app.admin.settings.storageTemplate.templateInput).toHaveValue('{{y}}/{{filename}}');
  });
});

describe('saving settings', () => {
  test('reloads the server features', async ({ router, render, settle, api, app }) => {
    await router.goto(Route.systemSettings());
    await render(Page, load);
    await app.admin.settings.open('admin.storage_template_settings');
    await app.admin.settings.storageTemplate.option('YYYY/MM/DD').click();
    const before = api.getServerFeatures.calls.length;

    await app.admin.settings.saveButton.click();
    await settle();

    expect(api.updateAdminConfig).toHaveBeenCalled();
    expect(api.getServerFeatures.calls.length).toBe(before + 1);
  });
});

describe('storage template settings from a config file', () => {
  test('cannot be changed', async ({ data, router, render, app }) => {
    data.serverFeatures.configFile = true;
    await featureFlagsManager.init();
    await router.goto(Route.systemSettings());
    await render(Page, load);

    await app.admin.settings.open('admin.storage_template_settings');

    await expect.element(app.admin.settings.storageTemplate.option('YYYY/MM/DD')).toBeDisabled();
    await expect.element(app.admin.settings.saveButton).toBeDisabled();
  });
});

describe('email notification settings', () => {
  const smtp = {
    enabled: true,
    from: 'Immich <noreply@example.com>',
    replyTo: '',
    transport: {
      ignoreCert: false,
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      username: 'immich',
      password: 'secret',
    },
  };

  test.beforeEach(async ({ data, router, render }) => {
    data.adminConfig.notifications.smtp = structuredClone(smtp);
    await router.goto(`${Route.systemSettings()}?isOpen=notifications+email`);
    await render(Page, load);
  });

  test('sends a test email with the edited settings and saves them', async ({ settle, api, app }) => {
    await app.admin.settings.notifications.secureSwitch.click();

    await app.admin.settings.notifications.sendTestEmailButton.click();
    await settle();

    const edited = { ...smtp, transport: { ...smtp.transport, secure: true } };
    expect(api.sendTestEmailAdmin).toHaveBeenCalledWith({
      body: { ...edited, replyTo: 'Immich <noreply@example.com>' },
    });
    expect(api.updateAdminConfig).toHaveBeenCalledWith({
      body: expect.objectContaining({ notifications: { smtp: edited } }),
    });
  });

  test('keeps the edited settings when the test email fails', async ({ settle, api, logger, app }) => {
    api.on({ sendTestEmailAdmin: () => ({ status: 400, json: { message: 'Connection refused', statusCode: 400 } }) });
    await app.admin.settings.notifications.secureSwitch.click();

    await app.admin.settings.notifications.sendTestEmailButton.click();
    await settle();

    expect(api.sendTestEmailAdmin).toHaveBeenCalled();
    expect(api.updateAdminConfig).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(/handleError/);
    await expect.element(app.admin.settings.notifications.secureSwitch).toBeChecked();
  });
});

describe('email notification settings from a config file', () => {
  test('sends a test email', async ({ data, router, render, settle, api, app }) => {
    data.adminConfig.notifications.smtp.enabled = true;
    data.serverFeatures.configFile = true;
    await featureFlagsManager.init();
    await router.goto(`${Route.systemSettings()}?isOpen=notifications+email`);
    await render(Page, load);

    await app.admin.settings.notifications.testEmailButton.click();
    await settle();

    expect(api.sendTestEmailAdmin).toHaveBeenCalledWith({
      body: {
        enabled: true,
        from: '',
        replyTo: '',
        transport: { ignoreCert: false, host: '', port: 587, secure: false, username: '', password: '' },
      },
    });
    expect(api.updateAdminConfig).not.toHaveBeenCalled();
  });
});
