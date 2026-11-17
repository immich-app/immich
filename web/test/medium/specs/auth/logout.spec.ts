import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';

const providerLogoutUrl = 'https://oauth.example.com/logout?post_logout_redirect_uri=immich';

test.describe('logout', () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll();
  });

  test('external logout redirect opens the provider', async ({ page, api, app }) => {
    api.on({ logout: () => ({ json: { successful: true, redirectUri: providerLogoutUrl } }) });
    await page.route('https://oauth.example.com/**', (route) =>
      route.fulfill({ body: '<h1>Signed out</h1>', contentType: 'text/html' }),
    );
    await page.goto(Route.photos());

    await app.navbar.signOut();

    await expect(page).toHaveURL(providerLogoutUrl);
    await expect(page.getByRole('heading', { name: 'Signed out' })).toBeVisible();
    expect(api.logout).toHaveBeenCalled();
  });
});
