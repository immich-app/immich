<script lang="ts">
  import { page } from '$app/stores';
  import DeleteConfirmDialog from '$lib/components/admin-page/delete-confirm-dialoge.svelte';
  import RestoreDialogue from '$lib/components/admin-page/restore-dialoge.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import CreateUserForm from '$lib/components/forms/create-user-form.svelte';
  import EditUserForm from '$lib/components/forms/edit-user-form.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { locale } from '$lib/stores/preferences.store';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { asByteUnitString } from '$lib/utils/byte-units';
  import { UserStatus, getAllUsers, type UserResponseDto } from '@immich/sdk';
  import { mdiClose, mdiDeleteRestore, mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let allUsers: UserResponseDto[] = [];
  let shouldShowEditUserForm = false;
  let shouldShowCreateUserForm = false;
  let shouldShowInfoPanel = false;
  let shouldShowDeleteConfirmDialog = false;
  let shouldShowRestoreDialog = false;
  let selectedUser: UserResponseDto;

  const refresh = async () => {
    allUsers = await getAllUsers({ isAll: false });
  };

  const onDeleteSuccess = (userId: string) => {
    const user = allUsers.find(({ id }) => id === userId);
    if (user) {
      allUsers = allUsers.filter((user) => user.id !== userId);
      notificationController.show({
        type: NotificationType.Info,
        message: `User ${user.email} has been successfully removed.`,
      });
    }
  };

  onMount(() => {
    allUsers = $page.data.allUsers;

    return websocketEvents.on('on_user_delete', onDeleteSuccess);
  });

  const deleteDateFormat: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  const getDeleteDate = (deletedAt: string): string => {
    return DateTime.fromISO(deletedAt)
      .plus({ days: $serverConfig.userDeleteDelay })
      .toLocaleString(deleteDateFormat, { locale: $locale });
  };

  const onUserCreated = async () => {
    await refresh();
    shouldShowCreateUserForm = false;
  };

  const editUserHandler = (user: UserResponseDto) => {
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
    shouldShowInfoPanel = true;
  };

  const deleteUserHandler = (user: UserResponseDto) => {
    selectedUser = user;
    shouldShowDeleteConfirmDialog = true;
  };

  const onUserDelete = async () => {
    await refresh();
    shouldShowDeleteConfirmDialog = false;
  };

  const restoreUserHandler = (user: UserResponseDto) => {
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
        <FullScreenModal onClose={() => (shouldShowCreateUserForm = false)}>
          <CreateUserForm on:submit={onUserCreated} on:cancel={() => (shouldShowCreateUserForm = false)} />
        </FullScreenModal>
      {/if}

      {#if shouldShowEditUserForm}
        <FullScreenModal onClose={() => (shouldShowEditUserForm = false)}>
          <EditUserForm
            user={selectedUser}
            canResetPassword={selectedUser?.id !== $user.id}
            on:editSuccess={onEditUserSuccess}
            on:resetPasswordSuccess={onEditPasswordSuccess}
            on:close={() => (shouldShowEditUserForm = false)}
          />
        </FullScreenModal>
      {/if}

      {#if shouldShowDeleteConfirmDialog}
        <DeleteConfirmDialog
          user={selectedUser}
          on:success={onUserDelete}
          on:fail={onUserDelete}
          on:cancel={() => (shouldShowDeleteConfirmDialog = false)}
        />
      {/if}

      {#if shouldShowRestoreDialog}
        <RestoreDialogue
          user={selectedUser}
          on:success={onUserRestore}
          on:fail={onUserRestore}
          on:cancel={() => (shouldShowRestoreDialog = false)}
        />
      {/if}

      {#if shouldShowInfoPanel}
        <FullScreenModal onClose={() => (shouldShowInfoPanel = false)}>
          <div
            class="w-[500px] max-w-[95vw] rounded-3xl bg-immich-bg p-8 text-immich-fg shadow-sm dark:bg-immich-dark-gray dark:text-immich-dark-fg"
          >
            <h1 class="mb-4 text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">
              Password reset success
            </h1>

            <p>
              The user's password has been reset to the default <code
                class="rounded-md bg-gray-200 px-2 py-1 font-bold text-immich-primary dark:text-immich-dark-primary dark:bg-gray-700"
                >password</code
              >
              <br />
              <br />
              Please inform the user, and they will need to change the password at the next log-on.
            </p>

            <div class="mt-6 flex w-full">
              <Button fullwidth on:click={() => (shouldShowInfoPanel = false)}>Done</Button>
            </div>
          </div>
        </FullScreenModal>
      {/if}

      <table class="my-5 w-full text-left">
        <thead
          class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
        >
          <tr class="flex w-full place-items-center">
            <th class="w-8/12 sm:w-5/12 lg:w-6/12 xl:w-4/12 2xl:w-5/12 text-center text-sm font-medium">Email</th>
            <th class="hidden sm:block w-3/12 text-center text-sm font-medium">Name</th>
            <th class="hidden xl:block w-3/12 2xl:w-2/12 text-center text-sm font-medium">Has quota</th>
            <th class="w-4/12 lg:w-3/12 xl:w-2/12 text-center text-sm font-medium">Action</th>
          </tr>
        </thead>
        <tbody class="block max-h-[320px] w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
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
                      {asByteUnitString(immichUser.quotaSizeInBytes, $locale)}
                    {:else}
                      <Icon path={mdiClose} size="16" />
                    {/if}
                  </div>
                </td>
                <td class="w-4/12 lg:w-3/12 xl:w-2/12 text-ellipsis break-all text-sm">
                  {#if !immichUser.deletedAt}
                    <button
                      on:click={() => editUserHandler(immichUser)}
                      class="rounded-full bg-immich-primary p-2 sm:p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700 max-sm:mb-1"
                    >
                      <Icon path={mdiPencilOutline} size="16" />
                    </button>
                    {#if immichUser.id !== $user.id}
                      <button
                        on:click={() => deleteUserHandler(immichUser)}
                        class="rounded-full bg-immich-primary p-2 sm:p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                      >
                        <Icon path={mdiTrashCanOutline} size="16" />
                      </button>
                    {/if}
                  {/if}
                  {#if immichUser.deletedAt && immichUser.status === UserStatus.Deleted}
                    <button
                      on:click={() => restoreUserHandler(immichUser)}
                      class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                      title="scheduled removal on {getDeleteDate(immichUser.deletedAt)}"
                    >
                      <Icon path={mdiDeleteRestore} size="16" />
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>

      <Button size="sm" on:click={() => (shouldShowCreateUserForm = true)}>Create user</Button>
    </section>
  </section>
</UserPageLayout>
