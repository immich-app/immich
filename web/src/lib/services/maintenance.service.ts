import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { MaintenanceAction, setMaintenanceMode, type SetMaintenanceModeDto } from '@immich/sdk';
import type { ActionItem } from '@immich/ui';
import { mdiProgressWrench } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getMaintenanceAdminActions = ($t: MessageFormatter) => {
  const StartMaintenance: ActionItem = {
    title: $t('admin.maintenance_start'),
    onAction: () =>
      handleSetMaintenanceMode({
        action: MaintenanceAction.Start,
      }),
    icon: mdiProgressWrench,
  };

  return { StartMaintenance };
};

export const handleSetMaintenanceMode = async (dto: SetMaintenanceModeDto) => {
  const $t = await getFormatter();

  try {
    await setMaintenanceMode({
      setMaintenanceModeDto: dto,
    });
  } catch (error) {
    handleError(error, $t('admin.maintenance_start_error'));
  }
};
