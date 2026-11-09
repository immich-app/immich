import { test } from '#test/unit/fixtures.ts';
import { DateTime } from 'luxon';
import { expect } from 'vitest';
import { page } from 'vitest/browser';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('shows the backup time relative to the backup timezone', async ({ data, render, app }) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-03-24T12:00:00Z'));
  data.backups.backups.push({
    filename: 'immich-db-backup-20260324T110000-v1.2.3-snapshot.sql.gz',
    filesize: 1024,
    timezone: 'Asia/Tokyo',
  });
  const relativeTime = DateTime.fromFormat('20260324T110000', "yyyyMMdd'T'HHmmss", { zone: 'Asia/Tokyo' })
    .toLocal()
    .toRelative({ locale: 'en' })!;

  await render(Page, load);
  await app.admin.maintenance.restoreBackupButton.click();

  await expect.element(page.getByText(relativeTime, { exact: true })).toBeVisible();
  vi.useRealTimers();
});
