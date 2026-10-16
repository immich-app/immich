import { UserStatus, type UserAdminResponseDto } from '@immich/sdk';
import { modalManager, type ActionItem } from '@immich/ui';
import {
  mdiDeleteRestore,
  mdiInformationOutline,
  mdiLockReset,
  mdiLockSmart,
  mdiPencilOutline,
  mdiPlusBoxOutline,
  mdiTrashCanOutline,
} from '@mdi/js';
import { DateTime } from 'luxon';
import type { MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import PasswordResetSuccessModal from '$lib/modals/PasswordResetSuccessModal.svelte';
import UserDeleteConfirmModal from '$lib/modals/UserDeleteConfirmModal.svelte';
import UserRestoreConfirmModal from '$lib/modals/UserRestoreConfirmModal.svelte';
import { executeMutation } from '$lib/queries/client';
import { updateUserAdminMutation } from '$lib/queries/user-admin.query';
import { Route } from '$lib/route';
import type { HeaderButtonActionItem } from '$lib/types';
import { getFormatter } from '$lib/utils/i18n';

export const getUserAdminsActions = ($t: MessageFormatter) => {
  const Create: ActionItem = {
    title: $t('create_user'),
    icon: mdiPlusBoxOutline,
    onAction: () => goto(Route.newUser()),
    shortcuts: { shift: true, key: 'n' },
  };

  return { Create };
};

export const getUserAdminActions = ($t: MessageFormatter, user: UserAdminResponseDto) => {
  const Detail: ActionItem = {
    icon: mdiInformationOutline,
    title: $t('details'),
    onAction: () => goto(Route.viewUser(user)),
  };

  const Update: ActionItem = {
    icon: mdiPencilOutline,
    title: $t('edit'),
    onAction: () => goto(Route.editUser(user)),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    color: 'danger',
    $if: () => authManager.user.id !== user.id && !user.deletedAt,
    onAction: () => modalManager.show(UserDeleteConfirmModal, { user }),
    shortcuts: { key: 'Backspace' },
    shortcutOptions: { ignoreInputFields: true },
  };

  const getDeleteDate = (deletedAt: string): Date =>
    DateTime.fromISO(deletedAt).plus({ days: serverConfigManager.value.userDeleteDelay }).toJSDate();

  const Restore: HeaderButtonActionItem = {
    icon: mdiDeleteRestore,
    title: $t('restore'),
    color: 'primary',
    data: {
      title: $t('admin.user_restore_scheduled_removal', { values: { date: getDeleteDate(user.deletedAt!) } }),
    },
    $if: () => !!user.deletedAt && user.status === UserStatus.Deleted,
    onAction: () => modalManager.show(UserRestoreConfirmModal, { user }),
  };

  const ResetPassword: ActionItem = {
    icon: mdiLockReset,
    title: $t('reset_password'),
    $if: () => authManager.user.id !== user.id,
    onAction: () => handleResetPasswordUserAdmin(user),
  };

  const ResetPinCode: ActionItem = {
    icon: mdiLockSmart,
    title: $t('reset_pin_code'),
    onAction: () => handleResetPinCodeUserAdmin(user),
  };

  return { Detail, Update, Delete, Restore, ResetPassword, ResetPinCode };
};

// TODO move password reset server-side
const generatePassword = (length: number = 16) => {
  let generatedPassword = '';

  const characterSet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ,.-{}+!#$%/()=?';

  for (let i = 0; i < length; i++) {
    let randomNumber = crypto.getRandomValues(new Uint32Array(1))[0];
    randomNumber /= 2 ** 32;
    randomNumber = Math.floor(randomNumber * characterSet.length);

    generatedPassword += characterSet[randomNumber];
  }

  return generatedPassword;
};

const handleResetPasswordUserAdmin = async (user: UserAdminResponseDto) => {
  const $t = await getFormatter();
  const prompt = $t('admin.confirm_user_password_reset', { values: { user: user.name } });
  const success = await modalManager.showDialog({ prompt });
  if (!success) {
    return;
  }

  const password = generatePassword();
  await executeMutation(
    updateUserAdminMutation,
    [{ id: user.id, userAdminUpdateDto: { password, shouldChangePassword: true } }],
    { onSuccess: () => void modalManager.show(PasswordResetSuccessModal, { newPassword: password }) },
  );
};

const handleResetPinCodeUserAdmin = async (user: UserAdminResponseDto) => {
  const $t = await getFormatter();
  const prompt = $t('admin.confirm_user_pin_code_reset', { values: { user: user.name } });
  const success = await modalManager.showDialog({ prompt });
  if (!success) {
    return;
  }

  await executeMutation(updateUserAdminMutation, [{ id: user.id, userAdminUpdateDto: { pinCode: null } }]);
};
