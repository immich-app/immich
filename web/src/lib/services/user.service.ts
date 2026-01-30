import { eventManager } from '$lib/managers/event-manager.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  changePassword,
  lockAuthSession,
  resetPinCode,
  type ChangePasswordDto,
  type PinCodeResetDto,
} from '@immich/sdk';
import { toastManager, type ActionItem } from '@immich/ui';
import { mdiLockOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getUserActions = ($t: MessageFormatter) => {
  const LockSession: ActionItem = {
    title: $t('lock'),
    color: 'primary',
    icon: mdiLockOutline,
    onAction: () => handleLockSession(),
  };

  return { LockSession };
};

const handleLockSession = async () => {
  const $t = await getFormatter();

  try {
    await lockAuthSession();
    eventManager.emit('SessionLocked');
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};

export const handleResetPinCode = async (dto: PinCodeResetDto) => {
  const $t = await getFormatter();

  try {
    await resetPinCode({ pinCodeResetDto: dto });
    toastManager.success($t('pin_code_reset_successfully'));
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
    toastManager.success($t('updated_password'));
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_change_password'));
  }
};
