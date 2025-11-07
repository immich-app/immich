import { goto } from '$app/navigation';
import { eventManager } from '$lib/managers/event-manager.svelte';
import PasswordResetSuccessModal from '$lib/modals/PasswordResetSuccessModal.svelte';
import UserCreateModal from '$lib/modals/UserCreateModal.svelte';
import UserDeleteConfirmModal from '$lib/modals/UserDeleteConfirmModal.svelte';
import UserEditModal from '$lib/modals/UserEditModal.svelte';
import UserRestoreConfirmModal from '$lib/modals/UserRestoreConfirmModal.svelte';
import { user as authUser } from '$lib/stores/user.store';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  createUserAdmin,
  deleteUserAdmin,
  restoreUserAdmin,
  updateUserAdmin,
  UserStatus,
  type UserAdminCreateDto,
  type UserAdminDeleteDto,
  type UserAdminResponseDto,
  type UserAdminUpdateDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import {
  mdiDeleteRestore,
  mdiLockReset,
  mdiLockSmart,
  mdiPencilOutline,
  mdiPlusBoxOutline,
  mdiTrashCanOutline,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { get } from 'svelte/store';

export const getUserAdminsActions = ($t: MessageFormatter) => {
  const Create: ActionItem = {
    title: $t('create_user'),
    type: $t('command'),
    icon: mdiPlusBoxOutline,
    onAction: () => void modalManager.show(UserCreateModal, {}),
    shortcuts: { shift: true, key: 'n' },
  };

  return { Create };
};

export const getUserAdminActions = ($t: MessageFormatter, user: UserAdminResponseDto) => {
  const Update: ActionItem = {
    icon: mdiPencilOutline,
    title: $t('edit'),
    onAction: () => modalManager.show(UserEditModal, { user }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    type: $t('command'),
    color: 'danger',
    $if: () => get(authUser).id !== user.id && !user.deletedAt,
    onAction: () => modalManager.show(UserDeleteConfirmModal, { user }),
    shortcuts: { key: 'Backspace' },
  };

  const Restore: ActionItem = {
    icon: mdiDeleteRestore,
    title: $t('restore'),
    type: $t('command'),
    color: 'primary',
    $if: () => !!user.deletedAt && user.status === UserStatus.Deleted,
    onAction: () => modalManager.show(UserRestoreConfirmModal, { user }),
  };

  const ResetPassword: ActionItem = {
    icon: mdiLockReset,
    title: $t('reset_password'),
    type: $t('command'),
    $if: () => get(authUser).id !== user.id,
    onAction: () => void handleResetPasswordUserAdmin(user),
  };

  const ResetPinCode: ActionItem = {
    icon: mdiLockSmart,
    type: $t('command'),
    title: $t('reset_pin_code'),
    onAction: () => void handleResetPinCodeUserAdmin(user),
  };

  return { Update, Delete, Restore, ResetPassword, ResetPinCode };
};

export const handleCreateUserAdmin = async (dto: UserAdminCreateDto) => {
  const $t = await getFormatter();

  try {
    const response = await createUserAdmin({ userAdminCreateDto: dto });
    eventManager.emit('UserAdminCreate', response);
    toastManager.success();
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_create_user'));
  }
};

export const handleUpdateUserAdmin = async (user: UserAdminResponseDto, dto: UserAdminUpdateDto) => {
  const $t = await getFormatter();

  try {
    const response = await updateUserAdmin({ id: user.id, userAdminUpdateDto: dto });
    eventManager.emit('UserAdminUpdate', response);
    toastManager.success();
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_user'));
    return false;
  }
};

export const handleDeleteUserAdmin = async (user: UserAdminResponseDto, dto: UserAdminDeleteDto) => {
  const $t = await getFormatter();

  try {
    const result = await deleteUserAdmin({ id: user.id, userAdminDeleteDto: dto });
    eventManager.emit('UserAdminDelete', result);
    toastManager.success();
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_user'));
  }
};

export const handleRestoreUserAdmin = async (user: UserAdminResponseDto) => {
  const $t = await getFormatter();

  try {
    const response = await restoreUserAdmin({ id: user.id });
    eventManager.emit('UserAdminRestore', response);
    toastManager.success();
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_restore_user'));
    return false;
  }
};

export const handleNavigateUserAdmin = async (user: UserAdminResponseDto) => {
  await goto(`/admin/users/${user.id}`);
};

// TODO move password reset server-side
const generatePassword = (length: number = 16) => {
  let generatedPassword = '';

  const characterSet = '0123456789' + 'abcdefghijklmnopqrstuvwxyz' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + ',.-{}+!#$%/()=?';

  for (let i = 0; i < length; i++) {
    let randomNumber = crypto.getRandomValues(new Uint32Array(1))[0];
    randomNumber = randomNumber / 2 ** 32;
    randomNumber = Math.floor(randomNumber * characterSet.length);

    generatedPassword += characterSet[randomNumber];
  }

  return generatedPassword;
};

export const handleResetPasswordUserAdmin = async (user: UserAdminResponseDto) => {
  const $t = await getFormatter();
  const prompt = $t('admin.confirm_user_password_reset', { values: { user: user.name } });
  const success = await modalManager.showDialog({ prompt });
  if (!success) {
    return false;
  }

  try {
    const dto = { password: generatePassword(), shouldChangePassword: true };
    const response = await updateUserAdmin({ id: user.id, userAdminUpdateDto: dto });
    eventManager.emit('UserAdminUpdate', response);
    toastManager.success();
    await modalManager.show(PasswordResetSuccessModal, { newPassword: dto.password });
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_reset_password'));
    return false;
  }
};

export const handleResetPinCodeUserAdmin = async (user: UserAdminResponseDto) => {
  const $t = await getFormatter();
  const prompt = $t('admin.confirm_user_pin_code_reset', { values: { user: user.name } });
  const success = await modalManager.showDialog({ prompt });
  if (!success) {
    return false;
  }

  try {
    const response = await updateUserAdmin({ id: user.id, userAdminUpdateDto: { pinCode: null } });
    eventManager.emit('UserAdminUpdate', response);
    toastManager.success($t('pin_code_reset_successfully'));
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_reset_pin_code'));
    return false;
  }
};
