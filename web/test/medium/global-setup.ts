import { Route } from '#lib/route.ts';
import { factory } from '#test/medium/mock/factories.ts';
import { Mock } from '#test/medium/mock/mock.ts';
import { chromium, type FullConfig } from '@playwright/test';

const warmUp = async (config: FullConfig) => {
  if (!process.env.PLAYWRIGHT_DEV_SERVER) {
    return;
  }
  const baseURL = config.projects[0].use.baseURL!;
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'dev');
  });
  await context.addCookies([{ name: 'immich_is_authenticated', value: 'true', url: baseURL }]);

  const mock = new Mock(context);
  await mock.install();
  const asset = factory.asset();
  mock.data.addAsset(asset);

  const page = await context.newPage();
  const routes = [
    Route.photos(),
    Route.viewAsset({ id: asset.id }),
    Route.favorites(),
    Route.archive(),
    Route.trash(),
    Route.albums(),
    Route.memories(),
    Route.search({ originalFileName: 'warm-up' }),
  ];
  for (const route of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });
  }
  await browser.close();
};

export default warmUp;
