<script lang="ts">
  import { goto } from '$app/navigation';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import GroupAvatar from '$lib/components/shared-components/GroupAvatar.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { AppRoute } from '$lib/constants';
  import GroupEditModal from '$lib/modals/GroupEditModal.svelte';
  import GroupEditUsersModal from '$lib/modals/GroupEditUsersModal.svelte';
  import { deleteGroupAdmin, getUsersForGroupAdmin } from '@immich/sdk';
  import {
    Alert,
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Code,
    Container,
    Heading,
    HStack,
    Icon,
    IconButton,
    modalManager,
    Stack,
    Text,
  } from '@immich/ui';
  import {
    mdiAccountMultipleOutline,
    mdiAccountOutline,
    mdiEyeOutline,
    mdiPencilOutline,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let group = $derived(data.group);
  let users = $derived(data.users);

  const handleEdit = async () => {
    const result = await modalManager.show(GroupEditModal, { group });
    if (result) {
      group = result;
    }
  };

  const handleDelete = async () => {
    const confirmed = await modalManager.showDialog({
      prompt: $t('confirm_delete_name', { values: { name: group.name } }),
      confirmColor: 'danger',
      icon: mdiTrashCanOutline,
    });

    if (confirmed) {
      await deleteGroupAdmin({ id: group.id });
      await goto(AppRoute.ADMIN_GROUPS);
    }
  };

  const handleEditUsers = async () => {
    const changed = await modalManager.show(GroupEditUsersModal, { group, users });
    if (changed) {
      users = await getUsersForGroupAdmin({ id: group.id });
    }
  };
</script>

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <HStack gap={0}>
      <Button
        color="secondary"
        size="small"
        variant="ghost"
        leadingIcon={mdiPencilOutline}
        onclick={() => handleEdit()}
      >
        <Text class="hidden md:block">{$t('edit_group')}</Text>
      </Button>
      <Button
        color="danger"
        size="small"
        variant="ghost"
        leadingIcon={mdiTrashCanOutline}
        onclick={() => handleDelete()}
      >
        <Text class="hidden md:block">{$t('delete_group')}</Text>
      </Button>
    </HStack>
  {/snippet}
  <div>
    <Container size="large" center>
      <div class="col-span-full flex gap-4 items-center my-4">
        <GroupAvatar {group} size="giant" />
        <div class="flex flex-col gap-1">
          <Heading tag="h1" size="large">{group.name}</Heading>
          {#if group.description}
            <Text color="muted">{group.description}</Text>
          {/if}
        </div>
      </div>
      <Stack gap={4}>
        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center gap-2">
            <div class="flex items-center gap-2 px-4 text-primary my-4">
              <Icon icon={mdiAccountMultipleOutline} size="2rem" />
              <Heading>Users</Heading>
            </div>
            <div>
              <Button leadingIcon={mdiPencilOutline} color="primary" size="small" onclick={() => handleEditUsers()}
                >{users.length === 0 ? $t('add_users') : $t('edit_users')}</Button
              >
            </div>
          </div>

          {#if users.length === 0}
            <Alert color="secondary" title={$t('empty_group_message')} icon={mdiAccountMultipleOutline} />
          {:else}
            <table class="w-full">
              <thead
                class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
              >
                <tr class="flex w-full place-items-center">
                  <th class="p-4 text-start w-4/12 text-sm font-medium">{$t('name')}</th>
                  <th class="p-4 text-start w-6/12 text-sm font-medium">{$t('email')}</th>
                  <th class="p-4 text-start w-2/12 text-sm font-medium">{$t('action')}</th>
                </tr>
              </thead>
              <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
                {#each users as user (user.id)}
                  <tr
                    class="flex h-[80px] overflow-hidden w-full place-items-center dark:text-immich-dark-fg even:bg-subtle/20 odd:bg-subtle/80"
                  >
                    <td class="px-4 py-2 w-4/12 text-ellipsis break-all text-sm">
                      <div class="flex items-center gap-2">
                        <UserAvatar {user} size="sm" />
                        {user.name}
                      </div>
                    </td>
                    <td class="px-4 py-2 w-6/12 text-ellipsis break-all text-sm">{user.email}</td>
                    <td class="px-4 w-2/12 flex flex-row flex-wrap gap-x-2 gap-y-1 text-ellipsis break-all text-sm">
                      <IconButton
                        shape="round"
                        size="medium"
                        icon={mdiEyeOutline}
                        href={`${AppRoute.ADMIN_USERS}/${user.id}`}
                        aria-label={$t('view_user')}
                      />
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
        <Card color="secondary">
          <CardHeader>
            <div class="flex items-center gap-2 px-4 py-2 text-primary">
              <Icon icon={mdiAccountOutline} size="1.5rem" />
              <CardTitle>{$t('details')}</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div class="px-4 pb-7">
              <Stack gap={2}>
                <div>
                  <Heading tag="h3" size="tiny">{$t('created_at')}</Heading>
                  <Text>{group.createdAt}</Text>
                </div>
                <div>
                  <Heading tag="h3" size="tiny">{$t('updated_at')}</Heading>
                  <Text>{group.updatedAt}</Text>
                </div>
                <div>
                  <Heading tag="h3" size="tiny">{$t('id')}</Heading>
                  <Code>{group.id}</Code>
                </div>
              </Stack>
            </div>
          </CardBody>
        </Card>
      </Stack>
    </Container>
  </div>
</AdminPageLayout>
