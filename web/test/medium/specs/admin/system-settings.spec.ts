import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test.describe('system settings', () => {
  test('previews an email template', async ({ page, api }) => {
    api.on({
      previewNotificationTemplateAdmin: () => ({
        body: '<style>p { color: rgb(255, 0, 0); }</style><p>Welcome preview</p>',
        contentType: 'text/html',
        headers: { 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox" },
      }),
    });
    await page.goto(Route.systemSettings());

    await page.getByRole('button', { name: 'admin.notification_settings' }).click();
    await page.getByRole('button', { name: 'admin.template_email_settings' }).click();
    await page.getByRole('button', { name: 'admin.template_email_preview' }).first().click();

    const preview = page.frameLocator('iframe').getByText('Welcome preview');
    await expect(preview).toBeVisible();
    await expect(preview).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(api.previewNotificationTemplateAdmin).toHaveBeenCalledWith({
      params: { name: 'welcome' },
      body: 'template=',
    });
  });

  test('previews the storage template', async ({ page, data, api }) => {
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
    await page.goto(Route.systemSettings());

    await page.getByRole('button', { name: 'admin.storage_template_settings' }).click();

    await expect(page.getByRole('option', { name: '2022/IMAGE_56437' })).toBeAttached();
    await expect(page.getByText('preview of {{y}}/{{filename}}.jpg')).toBeVisible();

    await page.getByRole('textbox', { name: 'template' }).fill('{{y}}/{{MM}}');

    await expect(page.getByText('preview of {{y}}/{{MM}}.jpg')).toBeVisible();
    expect(api.previewStorageTemplate).toHaveBeenCalledWith({ body: { template: '{{y}}/{{MM}}' } });
  });
});
