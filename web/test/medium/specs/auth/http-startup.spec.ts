import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';

test('login loads without crypto.randomUUID', async ({ context }) => {
  await context.clearCookies();
  const page = await context.newPage();

  try {
    await page.addInitScript(() => {
      Object.defineProperty(crypto, 'randomUUID', { value: undefined });
    });

    await page.goto(Route.login());

    await expect(page.getByRole('textbox', { name: 'email', exact: true })).toBeVisible();
    expect(await page.evaluate(() => typeof crypto.randomUUID)).toBe('undefined');
  } finally {
    await page.close();
  }
});
