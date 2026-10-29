import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { handleError } from '#lib/utils/handle-error.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { createJob, type JobCreateDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';

export const handleCreateJob = async (dto: JobCreateDto) => {
  const $t = await getFormatter();

  try {
    await createJob({ jobCreateDto: dto });
    eventManager.emit('JobCreate', { dto });
    toastManager.primary($t('admin.job_created'));
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_submit_job'));
  }
};
