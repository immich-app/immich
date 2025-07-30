<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    addUsersToGroupAdmin,
    removeUsersFromGroupAdmin,
    searchUsersAdmin,
    type GroupAdminResponseDto,
    type GroupUserAdminResponseDto,
    type UserAdminResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Button, Heading, HStack, Icon, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { mdiAccountMultipleOutline, mdiCheck, mdiClose } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    group: GroupAdminResponseDto;
    users: GroupUserAdminResponseDto[];
    onClose: (changed?: boolean) => void;
  }

  let { group, users, onClose }: Props = $props();
  let allUsers: UserAdminResponseDto[] = $state([]);
  let selectedUsers: Record<string, UserResponseDto> = $state(Object.fromEntries(users.map((user) => [user.id, user])));

  handlePromiseError(
    searchUsersAdmin({}).then((result) => {
      console.log(result);
      allUsers = result;
    }),
  );

  const handleToggle = (user: UserResponseDto) => {
    if (Object.keys(selectedUsers).includes(user.id)) {
      delete selectedUsers[user.id];
    } else {
      selectedUsers[user.id] = user;
    }
  };

  const handleConfirm = async () => {
    try {
      const existingUsers = Object.fromEntries(users.map((user) => [user.id, user]));
      const addUsers: UserAdminResponseDto[] = [];
      const removeUsers: UserAdminResponseDto[] = [];

      for (const user of allUsers) {
        const currentlyAdded = !!selectedUsers[user.id];
        const previouslyAdded = !!existingUsers[user.id];

        if (!previouslyAdded && currentlyAdded) {
          addUsers.push(user);
          continue;
        }

        if (previouslyAdded && !currentlyAdded) {
          removeUsers.push(user);
          continue;
        }
      }

      if (addUsers.length > 0) {
        await addUsersToGroupAdmin({
          id: group.id,
          groupUserCreateAllDto: {
            users: addUsers.map((user) => ({ userId: user.id })),
          },
        });
      }

      if (removeUsers.length > 0) {
        await removeUsersFromGroupAdmin({
          id: group.id,
          groupUserDeleteAllDto: { userIds: removeUsers.map(({ id }) => id) },
        });
      }

      onClose(addUsers.length > 0 || removeUsers.length > 0);
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_user'));
    }
  };
</script>

<Modal
  title={users.length === 0 ? $t('add_users') : $t('edit_users')}
  size="small"
  icon={mdiAccountMultipleOutline}
  {onClose}
>
  <ModalBody>
    <div class="immich-scrollbar max-h-[500px] overflow-y-auto">
      {#if Object.values(selectedUsers).length === 0}
        <div class="my-4">
          <Text size="large">{$t('empty_group_message')}</Text>
        </div>
      {/if}

      {#if Object.keys(selectedUsers).length > 0}
        <div class="mb-2 py-2 sticky">
          <Heading size="tiny">{$t('group_users')}</Heading>
          <div class="my-2">
            {#each Object.values(selectedUsers) as user (user.id)}
              <div class="flex place-items-center gap-4 p-4">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full border bg-green-600 text-3xl text-white"
                >
                  <Icon icon={mdiCheck} />
                </div>

                <!-- <UserAvatar {user} size="md" /> -->
                <div class="text-start grow">
                  <p class="text-immich-fg dark:text-immich-dark-fg">
                    {user.name}
                  </p>
                  <p class="text-xs">
                    {user.email}
                  </p>
                </div>

                <Button leadingIcon={mdiClose} color="secondary" size="small" onclick={() => handleToggle(user)}>
                  {$t('remove')}
                </Button>
                <!--
                    <Dropdown
                    title={$t('role')}
                    options={roleOptions}
                    render={({ title, icon }) => ({ title, icon })}
                    onSelect={({ value }) => handleChangeRole(user, value)}
                  /> -->
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if allUsers.length > 0 && allUsers.length !== Object.keys(selectedUsers).length}
        <Heading size="tiny">{$t('other_users')}</Heading>

        <div class="my-2">
          {#each allUsers as user (user.id)}
            {#if !Object.keys(selectedUsers).includes(user.id)}
              <div class="flex place-items-center transition-all hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl">
                <button
                  type="button"
                  onclick={() => handleToggle(user)}
                  class="flex w-full place-items-center gap-4 p-4"
                >
                  <UserAvatar {user} size="md" />
                  <div class="text-start grow">
                    <p class="text-immich-fg dark:text-immich-dark-fg">
                      {user.name}
                    </p>
                    <p class="text-xs">
                      {user.email}
                    </p>
                  </div>
                </button>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" fullWidth onclick={handleConfirm}>{$t('confirm')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
