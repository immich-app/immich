<script lang="ts">
  import { page } from '$app/stores';
  import DeleteConfirmDialog from '$lib/components/admin-page/delete-confirm-dialogue.svelte';
  import RestoreDialogue from '$lib/components/admin-page/restore-dialogue.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import CreateUserForm from '$lib/components/forms/create-user-form.svelte';
  import EditUserForm from '$lib/components/forms/edit-user-form.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { locale } from '$lib/stores/preferences.store';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { copyToClipboard } from '$lib/utils';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { UserStatus, searchUsersAdmin, type UserAdminResponseDto } from '@immich/sdk';
  import { mdiContentCopy, mdiDeleteRestore, mdiInfinity, mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  export let data: PageData;

  let allUsers: UserAdminResponseDto[] = [];
  let shouldShowEditUserForm = false;
  let shouldShowCreateUserForm = false;
  let shouldShowPasswordResetSuccess = false;
  let shouldShowDeleteConfirmDialog = false;
  let shouldShowRestoreDialog = false;
  let selectedUser: UserAdminResponseDto;
  let newPassword: string;

  const refresh = async () => {
    allUsers = await searchUsersAdmin({ withDeleted: true });
  };

  const onDeleteSuccess = (userId: string) => {
    const user = allUsers.find(({ id }) => id === userId);
    if (user) {
      allUsers = allUsers.filter((user) => user.id !== userId);
      notificationController.show({
        type: NotificationType.Info,
        message: $t('admin.user_successfully_removed', { values: { email: user.email } }),
      });
    }
  };

  onMount(() => {
    allUsers = $page.data.allUsers;

    return websocketEvents.on('on_user_delete', onDeleteSuccess);
  });

  const getDeleteDate = (deletedAt: string): Date => {
    return DateTime.fromISO(deletedAt).plus({ days: $serverConfig.userDeleteDelay }).toJSDate();
  };

  const onUserCreated = async () => {
    await refresh();
    shouldShowCreateUserForm = false;
  };

  const editUserHandler = (user: UserAdminResponseDto) => {
    selectedUser = user;
    shouldShowEditUserForm = true;
  };

  const onEditUserSuccess = async () => {
    await refresh();
    shouldShowEditUserForm = false;
  };

  const onEditPasswordSuccess = async () => {
    await refresh();
    shouldShowEditUserForm = false;
    shouldShowPasswordResetSuccess = true;
  };

  const deleteUserHandler = (user: UserAdminResponseDto) => {
    selectedUser = user;
    shouldShowDeleteConfirmDialog = true;
  };

  const onUserDelete = async () => {
    await refresh();
    shouldShowDeleteConfirmDialog = false;
  };

  const restoreUserHandler = (user: UserAdminResponseDto) => {
    selectedUser = user;
    shouldShowRestoreDialog = true;
  };

  const onUserRestore = async () => {
    await refresh();
    shouldShowRestoreDialog = false;
  };
</script>

<UserPageLayout title={data.meta.title} admin>
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 lg:w-[850px]">
      {#if shouldShowCreateUserForm}
        <CreateUserForm
          onSubmit={onUserCreated}
          onCancel={() => (shouldShowCreateUserForm = false)}
          onClose={() => (shouldShowCreateUserForm = false)}
        />
      {/if}

      {#if shouldShowEditUserForm}
        <EditUserForm
          user={selectedUser}
          bind:newPassword
          canResetPassword={selectedUser?.id !== $user.id}
          onEditSuccess={onEditUserSuccess}
          onResetPasswordSuccess={onEditPasswordSuccess}
          onClose={() => (shouldShowEditUserForm = false)}
        />
      {/if}

      {#if shouldShowDeleteConfirmDialog}
        <DeleteConfirmDialog
          user={selectedUser}
          onSuccess={onUserDelete}
          onFail={onUserDelete}
          onCancel={() => (shouldShowDeleteConfirmDialog = false)}
        />
      {/if}

      {#if shouldShowRestoreDialog}
        <RestoreDialogue
          user={selectedUser}
          onSuccess={onUserRestore}
          onFail={onUserRestore}
          onCancel={() => (shouldShowRestoreDialog = false)}
        />
      {/if}

      {#if shouldShowPasswordResetSuccess}
        <ConfirmDialog
          title={$t('password_reset_success')}
          confirmText={$t('done')}
          onConfirm={() => (shouldShowPasswordResetSuccess = false)}
          onCancel={() => (shouldShowPasswordResetSuccess = false)}
          hideCancelButton={true}
          confirmColor="green"
        >
          <svelte:fragment slot="prompt">
            <div class="flex flex-col gap-4">
              <p>{$t('admin.user_password_has_been_reset')}</p>

              <div class="flex justify-center gap-2">
                <code
                  class="rounded-md bg-gray-200 px-2 py-1 font-bold text-immich-primary dark:text-immich-dark-primary dark:bg-gray-700"
                >
                  {newPassword}
                </code>
                <LinkButton on:click={() => copyToClipboard(newPassword)} title={$t('copy_password')}>
                  <div class="flex place-items-center gap-2 text-sm">
                    <Icon path={mdiContentCopy} size="18" />
                  </div>
                </LinkButton>
              </div>

              <p>{$t('admin.user_password_reset_description')}</p>
            </div>
          </svelte:fragment>
        </ConfirmDialog>
      {/if}

      <table class="my-5 w-full text-left">
        <thead
          class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
        >
          <tr class="flex w-full place-items-center">
            <th class="w-8/12 sm:w-5/12 lg:w-6/12 xl:w-4/12 2xl:w-5/12 text-center text-sm font-medium"
              >{$t('email')}</th
            >
            <th class="hidden sm:block w-3/12 text-center text-sm font-medium">{$t('name')}</th>
            <th class="hidden xl:block w-3/12 2xl:w-2/12 text-center text-sm font-medium">{$t('has_quota')}</th>
            <th class="w-4/12 lg:w-3/12 xl:w-2/12 text-center text-sm font-medium">{$t('action')}</th>
          </tr>
        </thead>
        <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
          {#if allUsers}
            {#each allUsers as immichUser, index}
              <tr
                class="flex h-[80px] overflow-hidden w-full place-items-center text-center dark:text-immich-dark-fg {immichUser.deletedAt
                  ? 'bg-red-300 dark:bg-red-900'
                  : index % 2 == 0
                    ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
                    : 'bg-immich-bg dark:bg-immich-dark-gray/50'}"
              >
                <td class="w-8/12 sm:w-5/12 lg:w-6/12 xl:w-4/12 2xl:w-5/12 text-ellipsis break-all px-2 text-sm"
                  >{immichUser.email}</td
                >
                <td class="hidden sm:block w-3/12 text-ellipsis break-all px-2 text-sm">{immichUser.name}</td>
                <td class="hidden xl:block w-3/12 2xl:w-2/12 text-ellipsis break-all px-2 text-sm">
                  <div class="container mx-auto flex flex-wrap justify-center">
                    {#if immichUser.quotaSizeInBytes && immichUser.quotaSizeInBytes > 0}
                      {getByteUnitString(immichUser.quotaSizeInBytes, $locale)}
                    {:else}
                      <Icon path={mdiInfinity} size="16" />
                    {/if}
                  </div>
                </td>
                <td
                  class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-4/12 lg:w-3/12 xl:w-2/12 text-ellipsis break-all text-sm"
                >
                  {#if !immichUser.deletedAt}
                    <CircleIconButton
                      icon={mdiPencilOutline}
                      title={$t('edit_user')}
                      color="primary"
                      size="16"
                      on:click={() => editUserHandler(immichUser)}
                    />
                    {#if immichUser.id !== $user.id}
                      <CircleIconButton
                        icon={mdiTrashCanOutline}
                        title={$t('delete_user')}
                        color="primary"
                        size="16"
                        on:click={() => deleteUserHandler(immichUser)}
                      />
                    {/if}
                  {/if}
                  {#if immichUser.deletedAt && immichUser.status === UserStatus.Deleted}
                    <CircleIconButton
                      icon={mdiDeleteRestore}
                      title={$t('admin.user_restore_scheduled_removal', {
                        values: { date: getDeleteDate(immichUser.deletedAt) },
                      })}
                      color="primary"
                      size="16"
                      on:click={() => restoreUserHandler(immichUser)}
                    />
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>

      <Button size="sm" on:click={() => (shouldShowCreateUserForm = true)}>{$t('create_user')}</Button>
    </section>
  </section>
</UserPageLayout>
