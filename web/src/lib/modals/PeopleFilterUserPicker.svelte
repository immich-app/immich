<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { UserResponseDto } from '@immich/sdk';
  import { BasicModal, Icon, ListButton, Stack, Text } from '@immich/ui';
  import { mdiFilterOffOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    title: string;
    selected: string;
    users: UserResponseDto[];
    /** show a "no filter" option, which resolves to an empty string */
    allowEmpty?: boolean;
    // an empty string means "any user"
    onClose: (userId?: string) => void;
  };

  const { title, selected, users, allowEmpty = true, onClose }: Props = $props();
</script>

<BasicModal {title} onClose={() => onClose()} size="small">
  <Stack>
    {#if allowEmpty}
      <ListButton selected={selected === ''} onclick={() => onClose('')}>
        <div class="flex size-10 shrink-0 items-center justify-center">
          <Icon icon={mdiFilterOffOutline} size="24" />
        </div>
        <Text fontWeight="medium" class="grow text-start">{$t('no_filter')}</Text>
      </ListButton>
    {/if}
    {#each [authManager.user, ...users] as user (user.id)}
      <ListButton selected={selected === user.id} onclick={() => onClose(user.id)}>
        <UserAvatar {user} size="md" />
        <div class="grow text-start">
          <Text fontWeight="medium">{user.id === authManager.user.id ? $t('you') : user.name}</Text>
          <Text size="tiny" color="muted">{user.email}</Text>
        </div>
      </ListButton>
    {/each}
  </Stack>
</BasicModal>
