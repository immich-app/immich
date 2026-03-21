<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import UserGroupModal from '$lib/modals/UserGroupModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createGroup,
    getAllGroups,
    removeGroup,
    setMembers,
    updateGroup,
    UserAvatarColor,
    type UserGroupResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Button, IconButton, modalManager, Text } from '@immich/ui';
  import { mdiDelete, mdiPencil } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    user: UserResponseDto;
  }

  let { user }: Props = $props();

  let groups: UserGroupResponseDto[] = $state([]);

  const colorClasses: Record<string, string> = {
    primary: 'bg-immich-primary',
    pink: 'bg-pink-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500',
    amber: 'bg-amber-500',
  };

  onMount(async () => {
    await refreshGroups();
  });

  const refreshGroups = async () => {
    try {
      groups = await getAllGroups();
    } catch (error) {
      handleError(error, $t('errors.unable_to_load_groups'));
    }
  };

  const handleCreate = async () => {
    const result = await modalManager.show(UserGroupModal, { currentUserId: user.id });
    if (!result) {
      return;
    }

    try {
      const group = await createGroup({
        userGroupCreateDto: { name: result.name, color: result.color ?? undefined },
      });
      if (result.userIds.length > 0) {
        await setMembers({ id: group.id, userGroupMemberSetDto: { userIds: result.userIds } });
      }
      await refreshGroups();
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_group'));
    }
  };

  const handleEdit = async (group: UserGroupResponseDto) => {
    const result = await modalManager.show(UserGroupModal, { group, currentUserId: user.id });
    if (!result) {
      return;
    }

    try {
      await updateGroup({ id: group.id, userGroupUpdateDto: { name: result.name, color: result.color } });
      await setMembers({ id: group.id, userGroupMemberSetDto: { userIds: result.userIds } });
      await refreshGroups();
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_group'));
    }
  };

  const handleDelete = async (group: UserGroupResponseDto) => {
    const isConfirmed = await modalManager.showDialog({
      title: $t('delete_group'),
      prompt: $t('delete_group_description', { values: { group: group.name } }),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await removeGroup({ id: group.id });
      await refreshGroups();
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_group'));
    }
  };
</script>

<section class="my-4">
  {#if groups.length > 0}
    {#each groups as group (group.id)}
      <div class="rounded-2xl border border-gray-200 dark:border-gray-800 mt-4 bg-slate-50 dark:bg-gray-900 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            {#if group.color}
              <div class="h-3 w-3 rounded-full {colorClasses[group.color] ?? 'bg-gray-400'}"></div>
            {/if}
            <div>
              <Text fontWeight="medium">{group.name}</Text>
              <Text size="tiny" color="muted">
                {$t('group_member_count', { values: { count: group.members.length } })}
              </Text>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="flex -space-x-2">
              {#each group.members.slice(0, 5) as member (member.userId)}
                <UserAvatar
                  user={{
                    id: member.userId,
                    name: member.name,
                    email: member.email,
                    profileImagePath: member.profileImagePath ?? '',
                    avatarColor: (member.avatarColor as UserAvatarColor) ?? UserAvatarColor.Primary,
                    profileChangedAt: '',
                  }}
                  size="sm"
                />
              {/each}
              {#if group.members.length > 5}
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium"
                >
                  +{group.members.length - 5}
                </div>
              {/if}
            </div>

            <IconButton
              shape="round"
              color="secondary"
              variant="ghost"
              icon={mdiPencil}
              size="small"
              onclick={() => handleEdit(group)}
              aria-label={$t('edit')}
            />
            <IconButton
              shape="round"
              color="secondary"
              variant="ghost"
              icon={mdiDelete}
              size="small"
              onclick={() => handleDelete(group)}
              aria-label={$t('delete')}
            />
          </div>
        </div>
      </div>
    {/each}
  {:else}
    <Text class="py-4" color="muted">{$t('groups_empty_state')}</Text>
  {/if}

  <div class="flex justify-end mt-5">
    <Button shape="round" size="small" onclick={() => handleCreate()}>{$t('create_group')}</Button>
  </div>
</section>
