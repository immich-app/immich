import { Route } from '#lib/route.ts';
import { factory } from '#test/common/factories.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('creating the first private tag offers PIN setup and preserves the draft', async ({ page, data, api, app }) => {
  const tag = factory.tag({ name: 'Personal', isPrivate: true });
  api.on({
    createTag: () => {
      data.addTags(tag);
      return { status: 201, json: tag };
    },
  });
  await page.goto(Route.tags());
  await page.getByRole('button', { name: 'create_tag', exact: true }).click();
  const editor = page.getByRole('dialog').filter({ hasText: 'create_tag' });
  await editor.getByRole('textbox', { name: 'tag', exact: true }).fill('Personal');
  await editor.getByRole('switch', { name: 'private_tag', exact: true }).click();
  await editor.getByRole('button', { name: 'create', exact: true }).click();

  const unlock = page.getByRole('dialog').filter({ hasText: 'unlock_private_content' });
  await expect(unlock.getByText('setup_pin_code', { exact: true })).toBeVisible();
  expect(api.createTag).not.toHaveBeenCalled();
  await unlock.getByLabel('new_pin_code', { exact: true }).pressSequentially('123456');
  await unlock.getByLabel('confirm_new_pin_code', { exact: true }).pressSequentially('123456');
  await unlock.getByRole('button', { name: 'create', exact: true }).click();
  await expect(unlock.getByText('enter_your_pin_code', { exact: true })).toBeVisible();
  await unlock.getByRole('textbox').pressSequentially('123456');

  await expect(editor).toHaveCount(0);
  await expect(app.tags.child('Personal private_tag')).toBeVisible();
  await expect(page).toHaveURL(Route.tags());
  expect(api.setupPinCode).toHaveBeenCalledWith({ body: { pinCode: '123456' } });
  expect(api.unlockAuthSession).toHaveBeenCalledWith({ body: { pinCode: '123456' } });
  expect(api.createTag).toHaveBeenCalledWith({ body: { name: 'Personal', isPrivate: true } });
});

test('PIN management is available on Tags before a PIN has been configured', async ({ page, api }) => {
  await page.goto(Route.tags());
  await page.getByRole('button', { name: 'manage_pin_code', exact: true }).click();

  const settings = page.getByRole('dialog').filter({ hasText: 'user_pin_code_settings' });
  await settings.getByLabel('new_pin_code', { exact: true }).pressSequentially('123456');
  await settings.getByLabel('confirm_new_pin_code', { exact: true }).pressSequentially('123456');
  await settings.getByRole('button', { name: 'create', exact: true }).click();

  await expect(settings.getByText('change_pin_code', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(Route.tags());
  expect(api.setupPinCode).toHaveBeenCalledWith({ body: { pinCode: '123456' } });
});

test('making a public tag private unlocks with the existing PIN', async ({ page, data, api }) => {
  const tag = factory.tag({ name: 'Personal' });
  data.addTags(tag);
  data.setAuthStatus({ pinCode: true });
  api.on({
    updateTag: () => {
      const updated = { ...tag, isPrivate: true };
      data.addTags(updated);
      return { json: updated };
    },
  });
  await page.goto(Route.tags({ path: 'Personal' }));
  await page.getByRole('button', { name: 'edit_tag', exact: true }).click();
  const editor = page.getByRole('dialog').filter({ hasText: 'edit_tag' });
  await editor.getByRole('switch', { name: 'private_tag', exact: true }).click();
  await editor.getByRole('button', { name: 'save', exact: true }).click();

  const unlock = page.getByRole('dialog').filter({ hasText: 'unlock_private_content' });
  await expect(unlock.getByText('enter_your_pin_code', { exact: true })).toBeVisible();
  expect(api.updateTag).not.toHaveBeenCalled();
  await unlock.getByRole('textbox').pressSequentially('123456');

  await expect(editor).toHaveCount(0);
  await expect(page).toHaveURL(Route.tags({ path: 'Personal' }));
  expect(api.setupPinCode).not.toHaveBeenCalled();
  expect(api.unlockAuthSession).toHaveBeenCalledWith({ body: { pinCode: '123456' } });
  expect(api.updateTag).toHaveBeenCalledWith({
    params: { id: tag.id },
    body: { name: 'Personal', color: null, isPrivate: true },
  });
});

test('cancelling PIN setup leaves the private tag draft unsaved', async ({ page, api }) => {
  await page.goto(Route.tags());
  await page.getByRole('button', { name: 'create_tag', exact: true }).click();
  const editor = page.getByRole('dialog').filter({ hasText: 'create_tag' });
  await editor.getByRole('textbox', { name: 'tag', exact: true }).fill('Personal');
  await editor.getByRole('switch', { name: 'private_tag', exact: true }).click();
  await editor.getByRole('button', { name: 'create', exact: true }).click();

  const unlock = page.getByRole('dialog').filter({ hasText: 'unlock_private_content' });
  await expect(unlock.getByText('setup_pin_code', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  await expect(unlock).toHaveCount(0);
  await expect(editor.getByRole('textbox', { name: 'tag', exact: true })).toHaveValue('Personal');
  await expect(editor.getByRole('switch', { name: 'private_tag', exact: true })).toBeChecked();
  expect(api.setupPinCode).not.toHaveBeenCalled();
  expect(api.createTag).not.toHaveBeenCalled();
  expect(api.upsertTags).not.toHaveBeenCalled();
});

test('changes the shared PIN from Tags', async ({ page, data, api }) => {
  data.setAuthStatus({ pinCode: true });
  await page.goto(Route.tags());
  await page.getByRole('button', { name: 'manage_pin_code', exact: true }).click();
  const settings = page.getByRole('dialog').filter({ hasText: 'user_pin_code_settings' });

  await settings.getByLabel('current_pin_code', { exact: true }).pressSequentially('123456');
  await settings.getByLabel('new_pin_code', { exact: true }).pressSequentially('654321');
  await settings.getByLabel('confirm_new_pin_code', { exact: true }).pressSequentially('654321');
  await settings.getByRole('button', { name: 'save', exact: true }).click();

  await expect(page.getByText('pin_code_changed_successfully', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(Route.tags());
  expect(api.changePinCode).toHaveBeenCalledWith({ body: { pinCode: '123456', newPinCode: '654321' } });
});

test('resetting the PIN from Tags locks private content and offers setup again', async ({ page, data, api, app }) => {
  data.addTags(factory.tag({ name: 'Personal', isPrivate: true }));
  data.setAuthStatus({ pinCode: true, isElevated: true });
  await page.goto(Route.tags());
  const privateTag = app.tags.child('Personal private_tag');
  await expect(privateTag).toBeVisible();
  await page.getByRole('button', { name: 'manage_pin_code', exact: true }).click();
  const settings = page.getByRole('dialog').filter({ hasText: 'user_pin_code_settings' });
  await settings.getByRole('button', { name: 'forgot_pin_code_question', exact: true }).click();

  const reset = page.getByRole('dialog').filter({ hasText: 'reset_pin_code_description' });
  await reset.getByLabel('confirm_password', { exact: true }).fill('password');
  await reset.getByRole('button', { name: 'reset', exact: true }).click();

  await expect(privateTag).toHaveCount(0);
  await expect(settings.getByText('setup_pin_code', { exact: true })).toBeVisible();
  expect(api.resetPinCode).toHaveBeenCalledWith({ body: { password: 'password' } });
});

test('hides private tags and their children when the session is locked', async ({ page, data, api, app }) => {
  const publicTag = factory.tag({ name: 'Travel' });
  const privateTag = factory.tag({ name: 'Private photos', isPrivate: true });
  const child = factory.tag({ name: 'Family', value: 'Private photos/Family', parentId: privateTag.id });
  data.addTags([publicTag, privateTag, child]);
  data.setAuthStatus({ pinCode: true, isElevated: true });

  await page.goto(Route.tags());
  const privateTagButton = app.tags.child('Private photos private_tag');
  await expect(privateTagButton).toBeVisible();
  await page.getByRole('button', { name: 'lock', exact: true }).click();
  await expect(privateTagButton).toHaveCount(0);
  await expect(app.tags.child('Travel')).toBeVisible();
  expect(api.lockAuthSession).toHaveBeenCalled();

  await page.getByRole('button', { name: 'unlock_private_content' }).click();
  const unlock = page.getByRole('dialog').filter({ hasText: 'unlock_private_content' });
  await unlock.getByRole('textbox').pressSequentially('123456');
  await expect(privateTagButton).toBeVisible();
  await expect(page).toHaveURL(Route.tags());
  expect(api.unlockAuthSession).toHaveBeenCalledWith({ body: { pinCode: '123456' } });
});

test('hides private tags at PIN expiry without waiting for server status', async ({ page, data, app }) => {
  const date = new Date();
  await page.clock.install({ time: date });
  data.addTags([factory.tag({ name: 'Private photos', isPrivate: true })]);
  data.setAuthStatus({
    pinCode: true,
    isElevated: true,
    pinExpiresAt: new Date(date.getTime() + 60_000).toISOString(),
  });

  await page.goto(Route.tags());
  const privateTag = app.tags.child('Private photos private_tag');
  await expect(privateTag).toBeVisible();

  await page.clock.fastForward(60_000);
  await expect(privateTag).toHaveCount(0);
});

test('closes the private tag editor and leaves its route at PIN expiry', async ({ page, data }) => {
  const date = new Date();
  await page.clock.install({ time: date });
  data.addTags([factory.tag({ name: 'Private photos', isPrivate: true })]);
  data.setAuthStatus({
    pinCode: true,
    isElevated: true,
    pinExpiresAt: new Date(date.getTime() + 60_000).toISOString(),
  });

  await page.goto(Route.tags({ path: 'Private photos' }));
  await page.getByRole('button', { name: 'edit_tag', exact: true }).click();
  const modal = page.getByRole('dialog').filter({ hasText: 'edit_tag' });
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('textbox', { name: 'name' })).toHaveValue('Private photos');

  await page.clock.fastForward(60_000);
  await expect(modal).toHaveCount(0);
  await expect(page).toHaveURL(Route.tags());
});

test('a public tag draft can still be saved after the PIN expires', async ({ page, data, api, app }) => {
  const date = new Date();
  await page.clock.install({ time: date });
  data.setAuthStatus({
    pinCode: true,
    isElevated: true,
    pinExpiresAt: new Date(date.getTime() + 60_000).toISOString(),
  });

  await page.goto(Route.tags());
  await page.getByRole('button', { name: 'create_tag', exact: true }).click();
  const modal = page.getByRole('dialog').filter({ hasText: 'create_tag' });
  await modal.getByRole('textbox', { name: 'tag', exact: true }).fill('Travel');
  await page.clock.fastForward(60_000);
  await expect(modal).toBeVisible();

  await modal.getByRole('button', { name: 'create', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(app.tags.child('Travel')).toBeVisible();
  await expect(page.getByText('saved', { exact: true })).toBeVisible();
  expect(api.upsertTags).toHaveBeenCalledWith({ body: { tags: ['Travel'] } });
});

test('navigation keeps working after opening a tag path that does not exist', async ({ page, data, app }) => {
  const travel = factory.tag({ name: 'Travel' });
  const japan = factory.tag({ name: 'Japan', value: 'Travel/Japan', parentId: travel.id });
  const tokyo = factory.tag({ name: 'Tokyo', value: 'Travel/Japan/Tokyo', parentId: japan.id });
  data.addTags([travel, japan, tokyo]);
  await page.goto(Route.tags({ path: 'Missing' }));

  await app.tags.child('Travel').click();
  await expect(page).toHaveURL(Route.tags({ path: 'Travel' }));

  await app.tags.child('Japan').click();
  await expect(page).toHaveURL(Route.tags({ path: 'Travel/Japan' }));
  await expect(app.tags.child('Tokyo')).toBeVisible();
});
