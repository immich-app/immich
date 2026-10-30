import { QueueCommand, QueueName, runQueueCommandLegacy } from '@immich/sdk';
import { mutationOptions } from '@tanstack/svelte-query';

export const scanAllLibrariesMutation = () =>
  mutationOptions({
    mutationFn: () =>
      runQueueCommandLegacy({ name: QueueName.Library, queueCommandDto: { command: QueueCommand.Start } }),
    meta: {
      success: { toast: { color: 'info', description: 'admin.refreshing_all_libraries' } },
      error: { toast: 'errors.unable_to_scan_libraries' },
    },
  });
