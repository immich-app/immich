import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { createJob, type JobCreateDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { mdiCheck } from '@mdi/js';

export const handleCreateJob = async (dto: JobCreateDto) => {
  const $t = await getFormatter();

  try {
    await createJob({ jobCreateDto: dto });
    toastManager.show({ title: $t('success'), description: $t('admin.job_created'), icon: mdiCheck });
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_submit_job'));
  }
};
