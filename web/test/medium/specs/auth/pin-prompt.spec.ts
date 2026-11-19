import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test.describe('pin prompt', () => {
  test('unlocks the session with a PIN code', async ({ page, data, api }) => {
    data.setAuthStatus({ pinCode: true });
    await page.goto(Route.pinPrompt());

    await page.getByRole('textbox').pressSequentially('123456');

    await expect(page).toHaveURL(Route.locked());
    expect(api.unlockAuthSession).toHaveBeenCalledWith({ body: { pinCode: '123456' } });
  });

  test('sets up a PIN code when none is set', async ({ page, api }) => {
    await page.goto(Route.pinPrompt());

    await page.getByLabel('new_pin_code', { exact: true }).click();
    await page.keyboard.type('123456');
    await page.getByLabel('confirm_new_pin_code', { exact: true }).click();
    await page.keyboard.type('123456');
    await page.getByRole('button', { name: 'create', exact: true }).click();

    await expect(page.getByText('enter_your_pin_code_subtitle')).toBeVisible();
    expect(api.setupPinCode).toHaveBeenCalledWith({ body: { pinCode: '123456' } });
  });
});
