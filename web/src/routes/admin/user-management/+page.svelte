<script lang="ts">
  import { api, type UserResponseDto } from '@api';
  import { onMount } from 'svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import CreateUserForm from '$lib/components/forms/create-user-form.svelte';
  import EditUserForm from '$lib/components/forms/edit-user-form.svelte';
  import DeleteConfirmDialog from '$lib/components/admin-page/delete-confirm-dialoge.svelte';
  import RestoreDialogue from '$lib/components/admin-page/restore-dialoge.svelte';
  import { page } from '$app/stores';
  import { locale } from '$lib/stores/preferences.store';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';
  import { mdiCheck, mdiClose, mdiDeleteRestore, mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
  import { user } from '$lib/stores/user.store';
  import { asByteUnitString } from '$lib/utils/byte-units';

  export let data: PageData;

  let allUsers: UserResponseDto[] = [];
  let shouldShowEditUserForm = false;
  let shouldShowCreateUserForm = false;
  let shouldShowInfoPanel = false;
  let shouldShowDeleteConfirmDialog = false;
  let shouldShowRestoreDialog = false;
  let selectedUser: UserResponseDto;

  onMount(() => {
    allUsers = $page.data.allUsers;
  });

  const isDeleted = (user: UserResponseDto): boolean => {
    return user.deletedAt != undefined;
  };

  const deleteDateFormat: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  const getDeleteDate = (user: UserResponseDto): string => {
    let deletedAt = new Date(user.deletedAt ?? Date.now());
    deletedAt.setDate(deletedAt.getDate() + 7);
    return deletedAt.toLocaleString($locale, deleteDateFormat);
  };

  const onUserCreated = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowCreateUserForm = false;
  };

  const editUserHandler = async (user: UserResponseDto) => {
    selectedUser = user;
    shouldShowEditUserForm = true;
  };

  const onEditUserSuccess = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowEditUserForm = false;
  };

  const onEditPasswordSuccess = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowEditUserForm = false;
    shouldShowInfoPanel = true;
  };

  const deleteUserHandler = async (user: UserResponseDto) => {
    selectedUser = user;
    shouldShowDeleteConfirmDialog = true;
  };

  const onUserDeleteSuccess = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowDeleteConfirmDialog = false;
  };

  const onUserDeleteFail = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowDeleteConfirmDialog = false;
  };

  const restoreUserHandler = async (user: UserResponseDto) => {
    selectedUser = user;
    shouldShowRestoreDialog = true;
  };

  const onUserRestoreSuccess = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowRestoreDialog = false;
  };

  const onUserRestoreFail = async () => {
    // show fail dialog
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowRestoreDialog = false;
  };
</script>

<UserPageLayout title={data.meta.title} admin>
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 lg:w-[850px]">
      {#if shouldShowCreateUserForm}
        <FullScreenModal
          on:clickOutside={() => (shouldShowCreateUserForm = false)}
          on:escape={() => (shouldShowCreateUserForm = false)}
        >
          <CreateUserForm on:submit={onUserCreated} on:cancel={() => (shouldShowCreateUserForm = false)} />
        </FullScreenModal>
      {/if}

      {#if shouldShowEditUserForm}
        <FullScreenModal
          on:clickOutside={() => (shouldShowEditUserForm = false)}
          on:escape={() => (shouldShowEditUserForm = false)}
        >
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
          on:success={onUserDeleteSuccess}
          on:fail={onUserDeleteFail}
          on:cancel={() => (shouldShowDeleteConfirmDialog = false)}
        />
      {/if}

      {#if shouldShowRestoreDialog}
        <RestoreDialogue
          user={selectedUser}
          on:success={onUserRestoreSuccess}
          on:fail={onUserRestoreFail}
          on:cancel={() => (shouldShowRestoreDialog = false)}
        />
      {/if}

      {#if shouldShowInfoPanel}
        <FullScreenModal
          on:clickOutside={() => (shouldShowInfoPanel = false)}
          on:escape={() => (shouldShowInfoPanel = false)}
        >
          <div class="w-[500px] max-w-[95vw] rounded-3xl border bg-white p-8 text-sm shadow-sm">
            <h1 class="mb-4 text-lg font-medium text-immich-primary">Password reset success</h1>

            <p>
              The user's password has been reset to the default <code
                class="rounded-md bg-gray-200 px-2 py-1 font-bold text-immich-primary">password</code
              >
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
            <th class="hidden xl:block w-3/12 2xl:w-2/12 text-center text-sm font-medium">Can import</th>
            <th class="w-4/12 lg:w-3/12 xl:w-2/12 text-center text-sm font-medium">Action</th>
          </tr>
        </thead>
        <tbody class="block max-h-[320px] w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
          {#if allUsers}
            {#each allUsers as immichUser, index}
              <tr
                class="flex h-[80px] overflow-hidden w-full place-items-center text-center dark:text-immich-dark-fg {isDeleted(
                  immichUser,
                )
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
                <td class="hidden xl:block w-3/12 2xl:w-2/12 text-ellipsis break-all px-2 text-sm">
                  <div class="container mx-auto flex flex-wrap justify-center">
                    {#if immichUser.externalPath}
                      <Icon path={mdiCheck} size="16" />
                    {:else}
                      <Icon path={mdiClose} size="16" />
                    {/if}
                  </div>
                </td>

                <td class="w-4/12 lg:w-3/12 xl:w-2/12 text-ellipsis break-all text-sm">
                  {#if !isDeleted(immichUser)}
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
                  {#if isDeleted(immichUser)}
                    <button
                      on:click={() => restoreUserHandler(immichUser)}
                      class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                      title="scheduled removal on {getDeleteDate(immichUser)}"
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
