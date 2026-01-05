<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { getUserAdminsActions, handleNavigateUserAdmin } from '$lib/services/user-admin.service';
  import { locale } from '$lib/stores/preferences.store';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { searchUsersAdmin, type UserAdminResponseDto } from '@immich/sdk';
  import { Button, CommandPaletteDefaultProvider, Container, Icon } from '@immich/ui';
  import { mdiInfinity } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { LayoutData } from './$types';

  type Props = {
    children?: Snippet;
    data: LayoutData;
  };

  let { children, data }: Props = $props();

  let users: UserAdminResponseDto[] = $state(data.users);

  const onUpdate = async (user: UserAdminResponseDto) => {
    const index = users.findIndex(({ id }) => id === user.id);
    if (index === -1) {
      users = await searchUsersAdmin({ withDeleted: true });
    } else {
      users[index] = user;
    }
  };

  const onUserAdminDeleted = ({ id: userId }: { id: string }) => {
    users = users.filter(({ id }) => id !== userId);
  };

  const { Create } = $derived(getUserAdminsActions($t));
</script>

<OnEvents
  onUserAdminCreate={onUpdate}
  onUserAdminUpdate={onUpdate}
  onUserAdminDelete={onUpdate}
  onUserAdminRestore={onUpdate}
  {onUserAdminDeleted}
/>

<CommandPaletteDefaultProvider name={$t('users')} actions={[Create]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[Create]}>
  <Container center size="large">
    <table class="my-5 w-full text-start">
      <thead
        class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray"
      >
        <tr class="flex w-full place-items-center">
          <th class="w-8/12 sm:w-5/12 lg:w-6/12 xl:w-4/12 2xl:w-5/12 text-center text-sm font-medium">{$t('email')}</th>
          <th class="hidden sm:block w-3/12 text-center text-sm font-medium">{$t('name')}</th>
          <th class="hidden xl:block w-3/12 2xl:w-2/12 text-center text-sm font-medium">{$t('has_quota')}</th>
        </tr>
      </thead>
      <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
        {#each users as user (user.id)}
          <tr
            class="flex h-20 overflow-hidden w-full place-items-center text-center dark:text-immich-dark-fg {user.deletedAt
              ? 'bg-red-300 dark:bg-red-900'
              : 'even:bg-subtle/20 odd:bg-subtle/80'}"
          >
            <td class="w-8/12 sm:w-5/12 lg:w-6/12 xl:w-4/12 2xl:w-5/12 text-ellipsis break-all px-2 text-sm">
              {user.email}
            </td>
            <td class="hidden sm:block w-3/12 text-ellipsis break-all px-2 text-sm">{user.name}</td>
            <td class="hidden xl:block w-3/12 2xl:w-2/12 text-ellipsis break-all px-2 text-sm">
              <div class="container mx-auto flex flex-wrap justify-center">
                {#if user.quotaSizeInBytes !== null && user.quotaSizeInBytes >= 0}
                  {getByteUnitString(user.quotaSizeInBytes, $locale)}
                {:else}
                  <Icon icon={mdiInfinity} size="16" />
                {/if}
              </div>
            </td>
            <td
              class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-4/12 lg:w-3/12 xl:w-2/12 text-ellipsis break-all text-sm"
            >
              <Button onclick={() => handleNavigateUserAdmin(user)}>{$t('view')}</Button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {@render children?.()}
  </Container>
</AdminPageLayout>
