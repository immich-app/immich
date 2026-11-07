import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { UserStatus } from '@immich/sdk';

test.describe('user administration', () => {
  test('lists users and creates a new one', async ({ page, data, api, app }) => {
    const { form } = app.admin.users;
    await page.goto(Route.users());
    await expect(page).toHaveTitle(/admin\.user_management/);
    await expect(page.getByText(data.user.email)).toBeVisible();

    await app.admin.users.createUserButton.click();
    await expect(page).toHaveURL(Route.newUser());
    await form.emailInput.fill('user@immich.cloud');
    await form.passwordInput.fill('password');
    await form.confirmPasswordInput.fill('password');
    await form.nameInput.fill('Immich User');
    await form.createButton.click();

    await page.waitForURL(/\/admin\/users\/[0-9a-f-]+$/);
    await expect(page.getByText('user@immich.cloud')).toBeVisible();
    expect(api.createUserAdmin).toHaveBeenCalledWith({
      body: expect.objectContaining({ email: 'user@immich.cloud', name: 'Immich User', password: 'password' }),
    });
  });

  test('promotes a user to admin and revokes it again', async ({ page, data, api, app }) => {
    const { form } = app.admin.users;
    const user = factory.user({ name: 'Admin 2', email: 'admin2@immich.cloud', isAdmin: false });
    data.addUsers(user);

    await page.goto(Route.editUser(user));
    await expect(form.adminSwitch).not.toBeChecked();
    await form.adminSwitch.click();
    await expect(form.adminSwitch).toBeChecked();
    await form.saveButton.click();
    await expect(page).toHaveURL(Route.viewUser(user));
    expect(api.updateUserAdmin).toHaveBeenCalledWith({
      params: { id: user.id },
      body: expect.objectContaining({ isAdmin: true }),
    });

    await page.goto(Route.editUser(user));
    await expect(form.adminSwitch).toBeChecked();
    await form.adminSwitch.click();
    await expect(form.adminSwitch).not.toBeChecked();
    await form.saveButton.click();
    await expect(page).toHaveURL(Route.viewUser(user));
    expect(api.updateUserAdmin).toHaveBeenCalledWith({
      params: { id: user.id },
      body: expect.objectContaining({ isAdmin: false }),
    });
  });

  test('a deleted user only offers restore', async ({ page, data, app }) => {
    const user = factory.user({
      name: 'Gone User',
      email: 'gone@immich.cloud',
      isAdmin: false,
      deletedAt: '2026-10-01T00:00:00.000Z',
      status: UserStatus.Deleted,
    });
    data.addUsers(user);

    await page.goto(Route.viewUser(user));
    await expect(page.getByText('user_has_been_deleted')).toBeVisible();

    await expect(app.admin.users.restoreButton).toBeVisible();
    await expect(app.admin.users.editButton).toHaveCount(0);
    await expect(app.admin.users.deleteButton).toHaveCount(0);
    await expect(app.admin.users.resetPasswordButton).toHaveCount(0);
  });

  test('resets a user password', async ({ page, data, api, app }) => {
    const user = factory.user({ name: 'Reset User', email: 'reset@immich.cloud', isAdmin: false });
    data.addUsers(user);
    await page.goto(Route.viewUser(user));

    await app.admin.users.resetPasswordButton.click();
    await app.dialogButton('cancel').click();
    await expect(app.dialog).toBeHidden();
    expect(api.updateUserAdmin).not.toHaveBeenCalled();

    await app.admin.users.resetPasswordButton.click();
    await app.dialogButton('confirm').click();

    await expect.poll(() => api.updateUserAdmin.calls.length).toBe(1);
    expect(api.updateUserAdmin).toHaveBeenCalledWith({
      params: { id: user.id },
      body: { password: expect.any(String), shouldChangePassword: true },
    });
  });

  test('resets a user pin code', async ({ page, data, api, app }) => {
    const user = factory.user({ name: 'Reset User', email: 'reset@immich.cloud', isAdmin: false });
    data.addUsers(user);
    await page.goto(Route.viewUser(user));

    await app.admin.users.resetPinCodeButton.click();
    await app.dialogButton('cancel').click();
    await expect(app.dialog).toBeHidden();
    expect(api.updateUserAdmin).not.toHaveBeenCalled();

    await app.admin.users.resetPinCodeButton.click();
    await app.dialogButton('confirm').click();

    await expect.poll(() => api.updateUserAdmin.calls.length).toBe(1);
    expect(api.updateUserAdmin).toHaveBeenCalledWith({ params: { id: user.id }, body: { pinCode: null } });
  });
});
