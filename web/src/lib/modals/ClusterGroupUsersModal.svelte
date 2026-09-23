<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { getClusterGroupUsers, type UserResponseDto } from '@immich/sdk';
  import { Button, HStack, LoadingSpinner, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    clusterGroupId: string;
    onClose: (result?: 'accept' | 'decline') => void;
  };

  let { clusterGroupId, onClose }: Props = $props();

  let users: UserResponseDto[] = $state([]);

  const loadUsers = async () => {
    users = await getClusterGroupUsers({ id: clusterGroupId });
  };
</script>

<Modal title={$t('cluster_group')} {onClose} size="small">
  <ModalBody>
    {#await loadUsers()}
      <div class="flex w-full place-content-center place-items-center">
        <LoadingSpinner />
      </div>
    {:then _}
      <Text size="small" color="muted">{$t('cluster_group_invite_description')}</Text>

      <div class="mt-4">
        <Text size="small" fontWeight="medium">{$t('users')}</Text>
      </div>

      <div class="mt-4 flex max-h-75 immich-scrollbar flex-col gap-4 overflow-y-auto">
        {#each users as user (user.id)}
          <div class="flex items-center gap-4">
            <UserAvatar {user} size="md" />
            <div class="text-start">
              <Text fontWeight="medium">{user.name}</Text>
              <Text size="tiny" color="muted">{user.email}</Text>
            </div>
          </div>
        {/each}
      </div>
    {/await}
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="danger" fullWidth onclick={() => onClose('decline')}>{$t('decline')}</Button>
      <Button shape="round" fullWidth onclick={() => onClose('accept')}>{$t('accept')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
