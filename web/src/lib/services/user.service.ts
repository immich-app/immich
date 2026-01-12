import { eventManager } from '$lib/managers/event-manager.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { changePassword, resetPinCode, type ChangePasswordDto, type PinCodeResetDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { mdiCheck } from '@mdi/js';

export const handleResetPinCode = async (dto: PinCodeResetDto) => {
  const $t = await getFormatter();

  try {
    await resetPinCode({ pinCodeResetDto: dto });
    toastManager.show({ title: $t('success'), description: $t('pin_code_reset_successfully'), icon: mdiCheck });
    eventManager.emit('UserPinCodeReset');
    return true;
  } catch (error) {
    handleError(error, $t('errors.failed_to_reset_pin_code'));
  }
};

export const handleChangePassword = async (dto: ChangePasswordDto) => {
  const $t = await getFormatter();

  try {
    await changePassword({ changePasswordDto: dto });
    toastManager.show({ title: $t('success'), description: $t('updated_password'), icon: mdiCheck });
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_change_password'));
  }
};
