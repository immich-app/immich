import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { createJob, type JobCreateDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';

export const handleCreateJob = async (dto: JobCreateDto) => {
  const $t = await getFormatter();

  try {
    await createJob({ jobCreateDto: dto });
    toastManager.success($t('admin.job_created'));
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_submit_job'));
  }
};
