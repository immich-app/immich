import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import { load } from './+page.ts';

const visit = () => load({ url: new URL(Route.backups(), location.origin) } as never);

test('turns on the backups beta on first visit', async ({ api }) => {
  await visit();

  expect(api.updateConfig).toHaveBeenCalledWith({
    body: expect.objectContaining({
      backup: { beta: true, database: { enabled: true, cronExpression: '0 02 * * *', keepLastAmount: 14 } },
    }),
  });
});

test('leaves the config alone when the beta is already on', async ({ data, api }) => {
  data.adminConfig.backup.beta = true;

  await visit();

  expect(api.getConfig).toHaveBeenCalled();
  expect(api.updateConfig).not.toHaveBeenCalled();
});

test('still opens when the config cannot be loaded', async ({ api }) => {
  api.on({ getConfig: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });

  const result = await visit();

  expect(result).toEqual({ meta: { title: 'admin.backups' } });
  expect(api.updateConfig).not.toHaveBeenCalled();
});
