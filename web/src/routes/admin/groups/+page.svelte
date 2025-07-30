<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import GroupAvatar from '$lib/components/shared-components/GroupAvatar.svelte';
  import { AppRoute } from '$lib/constants';
  import GroupCreateModal from '$lib/modals/GroupCreateModal.svelte';
  import { searchGroupsAdmin, type GroupAdminResponseDto } from '@immich/sdk';
  import { Button, HStack, IconButton, Text, modalManager } from '@immich/ui';
  import { mdiEyeOutline, mdiPlusBoxOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let groups: GroupAdminResponseDto[] = $derived(data.groups);

  const refresh = async () => {
    groups = await searchGroupsAdmin({});
  };

  const handleCreate = async () => {
    await modalManager.show(GroupCreateModal);
    await refresh();
  };
</script>

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <HStack gap={1}>
      <Button leadingIcon={mdiPlusBoxOutline} onclick={handleCreate} size="small" variant="ghost" color="secondary">
        <Text class="hidden md:block">{$t('create_group')}</Text>
      </Button>
    </HStack>
  {/snippet}
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 lg:w-[850px]">
      <table class="my-5 w-full">
        <thead
          class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
        >
          <tr class="flex w-full place-items-center">
            <th class="p-4 text-start w-4/12 text-sm font-medium">{$t('name')}</th>
            <th class="p-4 text-start w-6/12 text-sm font-medium">{$t('description')}</th>
            <th class="p-4 text-start w-2/12 text-sm font-medium">{$t('action')}</th>
          </tr>
        </thead>
        <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
          {#if groups}
            {#each groups as group (group.id)}
              <tr
                class="flex h-[80px] overflow-hidden w-full place-items-center dark:text-immich-dark-fg even:bg-subtle/20 odd:bg-subtle/80"
              >
                <td class="p-4 w-4/12 text-ellipsis break-all text-sm">
                  <div class="flex items-center gap-2">
                    <GroupAvatar {group} />
                    {group.name}
                  </div>
                </td>
                <td class="p-4 w-6/12 text-ellipsis break-all text-sm">{group.description}</td>
                <td class="p-4 w-2/12 flex flex-row flex-wrap gap-x-2 gap-y-1 text-ellipsis break-all text-sm">
                  <IconButton
                    shape="round"
                    size="medium"
                    icon={mdiEyeOutline}
                    href={`${AppRoute.ADMIN_GROUPS}/${group.id}`}
                    aria-label={$t('view_group')}
                  />
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </section>
  </section>
</AdminPageLayout>
