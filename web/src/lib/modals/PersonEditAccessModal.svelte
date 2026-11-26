<script lang="ts">
  import HeaderActionButton from '#lib/components/HeaderActionButton.svelte';
  import UserAvatar from '#lib/components/shared-components/UserAvatar.svelte';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { queryClient } from '#lib/queries/client.ts';
  import { getClusterGroupUsersQuery } from '#lib/queries/cluster-group.query.ts';
  import { getUsersForPeopleQuery } from '#lib/queries/person.query.ts';
  import { getPersonUserActions, getPersonUsersActions } from '#lib/services/person-user.service.ts';
  import { SharingDirection, type PersonResponseDto, type UserResponseDto } from '@immich/sdk';
  import { ActionButton, BasicModal, HStack, Text, type ActionItem } from '@immich/ui';
  import { mdiAccountMultipleOutline } from '@mdi/js';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    onClose: () => void;
  };

  let { person, onClose }: Props = $props();

  const queries = {
    sharedBy: createQuery(
      () => getUsersForPeopleQuery({ personId: person.id, direction: SharingDirection.SharedBy }),
      () => queryClient,
    ),
    sharedWith: createQuery(
      () => getUsersForPeopleQuery({ personId: person.id, direction: SharingDirection.SharedWith }),
      () => queryClient,
    ),
    clusterGroupUsers: createQuery(
      () => getClusterGroupUsersQuery(authManager.user.clusterGroupId),
      () => queryClient,
    ),
  };
  const sharedBy = $derived(queries.sharedBy.data ?? []);
  const sharedByMeIds = $derived(new Set(sharedBy.map(({ sharedWithId }) => sharedWithId)));
  const sharedByMe = $derived(sharedBy.map(({ sharedWith }) => sharedWith));
  const sharedWithMe = $derived(
    (queries.sharedWith.data ?? []).map(({ sharedBy }) => sharedBy).filter(({ id }) => !sharedByMeIds.has(id)),
  );
  const clusterGroupUsers = $derived(queries.clusterGroupUsers.data ?? []);

  const { AddUsers } = $derived(getPersonUsersActions($t, person, [...sharedByMe, ...sharedWithMe], clusterGroupUsers));
</script>

{#snippet userCard(user: UserResponseDto, action: ActionItem, type: 'icon' | 'button')}
  <div class="rounded-2xl border border-gray-200 bg-slate-50 p-4 dark:border-gray-800 dark:bg-gray-900">
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 items-center gap-4">
        <UserAvatar {user} size="md" />
        <div class="min-w-0 text-start">
          <Text class="truncate">{user.name}</Text>
          <Text size="small" color="muted" class="truncate">{user.email}</Text>
        </div>
      </div>
      <ActionButton {type} shape="round" color={action.color ?? 'secondary'} variant="ghost" size="small" {action} />
    </div>
  </div>
{/snippet}

<BasicModal title={$t('manage_person_access')} size="medium" icon={mdiAccountMultipleOutline} {onClose}>
  <Text size="small" color="muted" class="mb-4">
    {$t('manage_people_access_description_v2', { values: { count: 1 } })}
  </Text>

  <HStack fullWidth class="my-2 justify-between">
    <Text size="medium" fontWeight="semi-bold">{$t('shared_by_me')}</Text>
    <HeaderActionButton action={AddUsers} />
  </HStack>

  <div class="flex flex-col gap-3">
    {#each sharedByMe as user (user.id)}
      {@render userCard(user, getPersonUserActions($t, person, user).Delete, 'icon')}
    {/each}
  </div>

  {#if sharedWithMe.length > 0}
    <Text size="medium" fontWeight="semi-bold" class="mt-4 mb-2">{$t('shared_with_me')}</Text>
    <div class="flex flex-col gap-3">
      {#each sharedWithMe as user (user.id)}
        {@render userCard(user, getPersonUserActions($t, person, user).ShareBack, 'button')}
      {/each}
    </div>
  {/if}
</BasicModal>
