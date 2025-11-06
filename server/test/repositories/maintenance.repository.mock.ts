import { MaintenanceRepository } from 'src/repositories/maintenance.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newMaintenanceRepositoryMock = (): Mocked<RepositoryInterface<MaintenanceRepository>> => {
  return {
    createLoginUrl: vitest.fn(),
    enterMaintenanceMode: vitest.fn(),
    exitApp: vitest.fn(),
    getMaintenanceMode: vitest.fn().mockResolvedValue({
      isMaintenanceMode: false as const,
    }),
    sendOneShotAppRestart: vitest.fn(),
    setCloseFn: vitest.fn(),
    setMaintenanceMode: vitest.fn(),
  };
};
