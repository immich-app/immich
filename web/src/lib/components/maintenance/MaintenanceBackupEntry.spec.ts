import { locale } from '$lib/stores/preferences.store';
import { renderWithTooltips } from '$tests/helpers';
import { screen } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MaintenanceBackupEntry from './MaintenanceBackupEntry.svelte';

vi.mock('$lib/services/database-backups.service', () => ({
  getDatabaseBackupActions: () => ({
    Download: { type: 'command', title: 'Download', onAction: vi.fn() },
    Delete: { type: 'command', title: 'Delete', onAction: vi.fn() },
  }),
  handleRestoreDatabaseBackup: vi.fn(),
}));

describe('MaintenanceBackupEntry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T12:00:00Z'));
    locale.set('en');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders relative backup time using the user timezone instead of UTC', () => {
    const backupTimestamp = '20260324T110000';

    const expectedRelativeTime = DateTime.fromFormat(backupTimestamp, "yyyyMMdd'T'HHmmss", {
      zone: 'Asia/Tokyo',
    })
      .toLocal()
      .toRelative({ locale: 'en' });

    const utcRelativeTime = DateTime.fromFormat(backupTimestamp, "yyyyMMdd'T'HHmmss", {
      zone: 'UTC',
    })
      .toLocal()
      .toRelative({ locale: 'en' });

    expect(expectedRelativeTime).toBeTruthy();
    expect(expectedRelativeTime).not.toEqual(utcRelativeTime);

    renderWithTooltips(MaintenanceBackupEntry, {
      expectedVersion: '1.2.3',
      filename: 'immich-db-backup-20260324T110000-v1.2.3-snapshot.sql.gz',
      filesize: 1024,
      timezone: 'Asia/Tokyo',
    });

    expect(screen.getByText(expectedRelativeTime!)).toBeInTheDocument();
  });
});
