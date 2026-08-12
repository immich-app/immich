<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { getClusterGroupUsers, type UserResponseDto } from '@immich/sdk';
  import { LoadingSpinner, Modal, ModalBody, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    clusterGroupId: string;
    onClose: () => void;
  }

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
      <div class="flex max-h-75 immich-scrollbar flex-col gap-4 overflow-y-auto">
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
</Modal>
