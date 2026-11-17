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
});
