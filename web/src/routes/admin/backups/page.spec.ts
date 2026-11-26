import { Route } from '#lib/route.ts';
import { test } from '#test/unit/fixtures.ts';
import { expect } from 'vitest';
import { load } from './+page.ts';

const visit = () => load({ url: new URL(Route.backups(), location.origin) } as never);

test('turns on the backups beta on first visit', async ({ api }) => {
  await visit();

  expect(api.updateAdminConfig).toHaveBeenCalledWith({
    body: expect.objectContaining({
      backup: { beta: true, database: { enabled: true, cronExpression: '0 02 * * *', keepLastAmount: 14 } },
    }),
  });
});

test('leaves the config alone when the beta is already on', async ({ data, api }) => {
  data.adminConfig.backup.beta = true;

  await visit();

  expect(api.getAdminConfig).toHaveBeenCalled();
  expect(api.updateAdminConfig).not.toHaveBeenCalled();
});

test('opens quietly when the beta cannot be turned on', async ({ api, logger }) => {
  api.on({ updateAdminConfig: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });

  const result = await visit();

  expect(result).toEqual({ meta: { title: 'admin.backups' } });
  expect(api.updateAdminConfig).toHaveBeenCalled();
  expect(logger.error).not.toHaveBeenCalled();
});
