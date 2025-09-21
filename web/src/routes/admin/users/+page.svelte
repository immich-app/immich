<script lang="ts">
  import { page } from '$app/stores';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { AppRoute } from '$lib/constants';
  import UserCreateModal from '$lib/modals/UserCreateModal.svelte';
  import UserDeleteConfirmModal from '$lib/modals/UserDeleteConfirmModal.svelte';
  import UserRestoreConfirmModal from '$lib/modals/UserRestoreConfirmModal.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { UserStatus, searchUsersAdmin, type UserAdminResponseDto } from '@immich/sdk';
  import { Button, HStack, Icon, IconButton, Text, modalManager } from '@immich/ui';
  import { mdiDeleteRestore, mdiEyeOutline, mdiInfinity, mdiPlusBoxOutline, mdiTrashCanOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let allUsers: UserAdminResponseDto[] = $state([]);

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

  const handleCreate = async () => {
    await modalManager.show(UserCreateModal);
    await refresh();
  };

  const handleDelete = async (user: UserAdminResponseDto) => {
    const result = await modalManager.show(UserDeleteConfirmModal, { user });
    if (result) {
      await refresh();
    }
  };

  const handleRestore = async (user: UserAdminResponseDto) => {
    const result = await modalManager.show(UserRestoreConfirmModal, { user });
    if (result) {
      await refresh();
    }
  };
</script>

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <HStack gap={1}>
      <Button leadingIcon={mdiPlusBoxOutline} onclick={handleCreate} size="small" variant="ghost" color="secondary">
        <Text class="hidden md:block">{$t('create_user')}</Text>
      </Button>
    </HStack>
  {/snippet}
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 lg:w-[850px]">
      <table class="my-5 w-full text-start">
        <thead
          class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray"
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
            {#each allUsers as immichUser (immichUser.id)}
              <tr
                class="flex h-[80px] overflow-hidden w-full place-items-center text-center dark:text-immich-dark-fg {immichUser.deletedAt
                  ? 'bg-red-300 dark:bg-red-900'
                  : 'even:bg-subtle/20 odd:bg-subtle/80'}"
              >
                <td class="w-8/12 sm:w-5/12 lg:w-6/12 xl:w-4/12 2xl:w-5/12 text-ellipsis break-all px-2 text-sm">
                  {immichUser.email}
                </td>
                <td class="hidden sm:block w-3/12 text-ellipsis break-all px-2 text-sm">{immichUser.name}</td>
                <td class="hidden xl:block w-3/12 2xl:w-2/12 text-ellipsis break-all px-2 text-sm">
                  <div class="container mx-auto flex flex-wrap justify-center">
                    {#if immichUser.quotaSizeInBytes !== null && immichUser.quotaSizeInBytes >= 0}
                      {getByteUnitString(immichUser.quotaSizeInBytes, $locale)}
                    {:else}
                      <Icon icon={mdiInfinity} size="16" />
                    {/if}
                  </div>
                </td>
                <td
                  class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-4/12 lg:w-3/12 xl:w-2/12 text-ellipsis break-all text-sm"
                >
                  {#if !immichUser.deletedAt}
                    <IconButton
                      shape="round"
                      size="medium"
                      icon={mdiEyeOutline}
                      title={$t('view_user')}
                      href={`${AppRoute.ADMIN_USERS}/${immichUser.id}`}
                      aria-label={$t('view_user')}
                    />
                    {#if immichUser.id !== $user.id}
                      <IconButton
                        shape="round"
                        size="medium"
                        icon={mdiTrashCanOutline}
                        title={$t('delete_user')}
                        onclick={() => handleDelete(immichUser)}
                        aria-label={$t('delete_user')}
                      />
                    {/if}
                  {/if}
                  {#if immichUser.deletedAt && immichUser.status === UserStatus.Deleted}
                    <IconButton
                      shape="round"
                      size="medium"
                      icon={mdiDeleteRestore}
                      title={$t('admin.user_restore_scheduled_removal', {
                        values: { date: getDeleteDate(immichUser.deletedAt) },
                      })}
                      onclick={() => handleRestore(immichUser)}
                      aria-label={$t('admin.user_restore_scheduled_removal')}
                    />
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </section>
  </section>
</AdminPageLayout>
