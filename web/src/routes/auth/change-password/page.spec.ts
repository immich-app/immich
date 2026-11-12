import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

const preventNativeFormSubmit = () => {
  const listener = (event: Event) => event.preventDefault();
  document.addEventListener('submit', listener);
  return () => document.removeEventListener('submit', listener);
};

test('changes the password and logs out', async ({ data, router, render, settle, api, app }) => {
  data.user.shouldChangePassword = true;
  await router.goto(Route.changePassword());
  await render(Page, load);
  const restoreFormSubmit = preventNativeFormSubmit();

  try {
    await app.auth.input('password').fill('old-password');
    await app.auth.input('new_password').fill('new-password');
    await app.auth.input('confirm_password').fill('new-password');
    await app.auth.changePasswordButton.click();
    await settle();
  } finally {
    restoreFormSubmit();
  }

  expect(api.changePassword).toHaveBeenCalledWith({ body: { password: 'old-password', newPassword: 'new-password' } });
  expect(router.url.pathname).toBe(Route.logout());
});

test('does not change the password when the new passwords do not match', async ({ data, router, render, app }) => {
  data.user.shouldChangePassword = true;
  await router.goto(Route.changePassword());
  await render(Page, load);

  await app.auth.input('password').fill('old-password');
  await app.auth.input('new_password').fill('new-password');
  await app.auth.input('confirm_password').fill('different');

  await expect.element(app.auth.text('password_does_not_match')).toBeVisible();
  await expect.element(app.auth.changePasswordButton).toBeDisabled();
});

test('redirects to photos when the password does not need to change', async ({ router, render }) => {
  await router.goto(Route.changePassword());

  await expect(render(Page, load)).rejects.toThrow(`redirected to ${Route.photos()}`);
});
