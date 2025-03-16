<script lang="ts">
  import { page } from '$app/stores';
  import DeleteConfirmDialog from '$lib/components/admin-page/delete-confirm-dialogue.svelte';
  import RestoreDialogue from '$lib/components/admin-page/restore-dialogue.svelte';
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
  import { featureFlags, serverConfig } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { copyToClipboard } from '$lib/utils';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { UserStatus, searchUsersAdmin, type UserAdminResponseDto } from '@immich/sdk';
  import { Button, Code, IconButton, Text } from '@immich/ui';
  import { mdiContentCopy, mdiDeleteRestore, mdiInfinity, mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let allUsers: UserAdminResponseDto[] = $state([]);
  let shouldShowEditUserForm = $state(false);
  let shouldShowCreateUserForm = $state(false);
  let shouldShowPasswordResetSuccess = $state(false);
  let shouldShowDeleteConfirmDialog = $state(false);
  let shouldShowRestoreDialog = $state(false);
  let selectedUser = $state<UserAdminResponseDto>();
  let newPassword = $state('');

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
          oauthEnabled={$featureFlags.oauth}
        />
      {/if}

      {#if shouldShowEditUserForm && selectedUser}
        <EditUserForm
          user={selectedUser}
          bind:newPassword
          canResetPassword={selectedUser?.id !== $user.id}
          onEditSuccess={onEditUserSuccess}
          onResetPasswordSuccess={onEditPasswordSuccess}
          onClose={() => (shouldShowEditUserForm = false)}
        />
      {/if}

      {#if shouldShowDeleteConfirmDialog && selectedUser}
        <DeleteConfirmDialog
          user={selectedUser}
          onSuccess={onUserDelete}
          onFail={onUserDelete}
          onCancel={() => (shouldShowDeleteConfirmDialog = false)}
        />
      {/if}

      {#if shouldShowRestoreDialog && selectedUser}
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
          confirmColor="success"
        >
          {#snippet promptSnippet()}
            <div class="flex flex-col gap-4">
              <Text>{$t('admin.user_password_has_been_reset')}</Text>

              <div class="flex justify-center gap-2 items-center">
                <Code color="primary">{newPassword}</Code>
                <IconButton
                  icon={mdiContentCopy}
                  shape="round"
                  color="secondary"
                  variant="ghost"
                  onclick={() => copyToClipboard(newPassword)}
                  title={$t('copy_password')}
                  aria-label={$t('copy_password')}
                />
              </div>

              <Text>{$t('admin.user_password_reset_description')}</Text>
            </div>
          {/snippet}
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
            {#each allUsers as immichUser, index (immichUser.id)}
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
                    <IconButton
                      shape="round"
                      size="small"
                      icon={mdiPencilOutline}
                      title={$t('edit_user')}
                      onclick={() => editUserHandler(immichUser)}
                      aria-label={$t('edit_user')}
                    />
                    {#if immichUser.id !== $user.id}
                      <IconButton
                        shape="round"
                        size="small"
                        icon={mdiTrashCanOutline}
                        title={$t('delete_user')}
                        onclick={() => deleteUserHandler(immichUser)}
                        aria-label={$t('delete_user')}
                      />
                    {/if}
                  {/if}
                  {#if immichUser.deletedAt && immichUser.status === UserStatus.Deleted}
                    <IconButton
                      shape="round"
                      size="small"
                      icon={mdiDeleteRestore}
                      title={$t('admin.user_restore_scheduled_removal', {
                        values: { date: getDeleteDate(immichUser.deletedAt) },
                      })}
                      onclick={() => restoreUserHandler(immichUser)}
                      aria-label={$t('admin.user_restore_scheduled_removal')}
                    />
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
      <Button shape="round" size="small" onclick={() => (shouldShowCreateUserForm = true)}>{$t('create_user')}</Button>
    </section>
  </section>
</UserPageLayout>
