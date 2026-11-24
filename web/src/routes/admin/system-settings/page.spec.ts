import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { ConfigSource } from '@immich/sdk';
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

describe('settings set outside the database', () => {
  const lockedField = (key: string, envName: string, value: unknown, source = ConfigSource.Env) => ({
    key,
    envName,
    value,
    sources: [{ source, value }],
    isEditable: false,
  });

  test('a setting set by an environment variable is disabled', async ({ data, router, render, app }) => {
    data.adminConfigFields = [lockedField('trash.days', 'IMMICH_CONFIG_TRASH_DAYS', 30)];
    await router.goto(Route.systemSettings());
    await render(Page, load);

    await app.admin.settings.open('admin.trash_settings');

    await expect.element(app.admin.settings.trash.daysInput).toBeDisabled();
    await expect.element(app.admin.settings.text('IMMICH_CONFIG_TRASH_DAYS')).toBeVisible();
  });

  test('a neighbouring setting stays editable', async ({ data, router, render, settle, api, app }) => {
    data.adminConfigFields = [lockedField('trash.days', 'IMMICH_CONFIG_TRASH_DAYS', 30)];
    await router.goto(Route.systemSettings());
    await render(Page, load);
    await app.admin.settings.open('admin.trash_settings');

    await app.admin.settings.trash.enabledSwitch.click();
    await app.admin.settings.saveButton.click();
    await settle();

    expect(api.updateAdminConfig).toHaveBeenCalledWith({
      body: expect.objectContaining({ trash: { enabled: false, days: 30 } }),
    });
  });

  test('a setting set by the config file shows the config file hint', async ({ data, router, render, app }) => {
    data.adminConfig.storageTemplate = { enabled: true, hashVerificationEnabled: true, template: '{{y}}/{{filename}}' };
    data.adminConfigFields = [
      lockedField(
        'storageTemplate.template',
        'IMMICH_CONFIG_STORAGE_TEMPLATE_TEMPLATE',
        '{{y}}/{{filename}}',
        ConfigSource.File,
      ),
    ];
    await router.goto(Route.systemSettings());
    await render(Page, load);

    await app.admin.settings.open('admin.storage_template_settings');

    await expect.element(app.admin.settings.storageTemplate.templateInput).toBeDisabled();
    await expect.element(app.admin.settings.text('admin.config_set_by_config_file')).toBeVisible();
  });

  test('reset to default leaves a locked setting unchanged', async ({ data, router, render, settle, api, app }) => {
    const defaults = structuredClone(data.adminConfig);
    api.on({ getAdminConfigDefaults: () => ({ json: defaults }) });
    data.adminConfig.trash = { enabled: false, days: 10 };
    data.adminConfigFields = [lockedField('trash.days', 'IMMICH_CONFIG_TRASH_DAYS', 10)];
    await router.goto(Route.systemSettings());
    await render(Page, load);
    await app.admin.settings.open('admin.trash_settings');

    await app.admin.settings.resetToDefaultButton.click();
    await app.admin.settings.saveButton.click();
    await settle();

    expect(api.updateAdminConfig).toHaveBeenCalledWith({
      body: expect.objectContaining({ trash: { enabled: true, days: 10 } }),
    });
  });

  test('reset to default is hidden when only locked settings differ', async ({ data, router, render, api, app }) => {
    const defaults = structuredClone(data.adminConfig);
    api.on({ getAdminConfigDefaults: () => ({ json: defaults }) });
    data.adminConfig.trash.days = 10;
    data.adminConfigFields = [lockedField('trash.days', 'IMMICH_CONFIG_TRASH_DAYS', 10)];
    await router.goto(Route.systemSettings());
    await render(Page, load);

    await app.admin.settings.open('admin.trash_settings');

    await expect.element(app.admin.settings.trash.daysInput).toBeDisabled();
    await expect.element(app.admin.settings.resetToDefaultButton).not.toBeInTheDocument();
  });

  test('a locked array setting disables every row', async ({ data, router, render, app }) => {
    const urls = ['http://ml-1:3003', 'http://ml-2:3003'];
    data.adminConfig.machineLearning.urls = urls;
    data.adminConfigFields = [lockedField('machineLearning.urls', 'IMMICH_CONFIG_MACHINE_LEARNING_URLS', urls)];
    await router.goto(Route.systemSettings());
    await render(Page, load);

    await app.admin.settings.open('admin.machine_learning_settings');

    for (const index of [0, 1]) {
      await expect.element(app.admin.settings.machineLearning.urlInput(index)).toBeDisabled();
      await expect.element(app.admin.settings.machineLearning.removeUrlButton(index)).toBeDisabled();
    }
    await expect.element(app.admin.settings.machineLearning.addUrlButton).toBeDisabled();
    await expect.element(app.admin.settings.text('IMMICH_CONFIG_MACHINE_LEARNING_URLS')).toBeVisible();
  });

  test('a locked cron setting shows its hint once', async ({ data, router, render, app }) => {
    data.adminConfigFields = [
      lockedField('backup.database.cronExpression', 'IMMICH_CONFIG_BACKUP_DATABASE_CRON_EXPRESSION', '0 02 * * *'),
    ];
    await router.goto(Route.systemSettings());
    await render(Page, load);

    await app.admin.settings.open('admin.backup_settings');

    await expect.element(app.admin.settings.backup.cronPresetSelect).toBeDisabled();
    await expect.element(app.admin.settings.backup.cronInput).toBeDisabled();
    await expect.element(app.admin.settings.text('IMMICH_CONFIG_BACKUP_DATABASE_CRON_EXPRESSION')).toBeVisible();
  });

  test('storage template options are disabled when locked', async ({ data, router, render, app }) => {
    data.adminConfigFields = [lockedField('storageTemplate.enabled', 'IMMICH_CONFIG_STORAGE_TEMPLATE_ENABLED', false)];
    await router.goto(Route.systemSettings());
    await render(Page, load);

    await app.admin.settings.open('admin.storage_template_settings');

    await expect.element(app.admin.settings.storageTemplate.option('YYYY/MM/DD')).toBeDisabled();
    await expect
      .element(app.admin.settings.storageTemplate.option('admin.storage_template_option_none'))
      .toBeDisabled();
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
