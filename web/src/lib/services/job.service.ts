import { eventManager } from '#lib/managers/event-manager.svelte.js';
import { handleError } from '#lib/utils/handle-error.js';
import { getFormatter } from '#lib/utils/i18n.js';
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
