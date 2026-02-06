import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { toastManager } from '@immich/ui';
import { changePassword, type ChangePasswordDto } from '@server/sdk';

export const handleChangePassword = async (dto: ChangePasswordDto) => {
  const $t = await getFormatter();

  try {
    await changePassword({ changePasswordDto: dto });
    toastManager.success($t('updated_password'));
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_change_password'));
  }
};
