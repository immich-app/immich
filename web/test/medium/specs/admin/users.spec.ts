import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { factory } from '#test/medium/mock/factories.ts';

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
    data.addUser(user);

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
});
