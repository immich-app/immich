<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { restoreUserAdmin, type UserAdminResponseDto, type UserResponseDto } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiDeleteRestore } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    user: UserResponseDto;
    onClose: (user?: UserAdminResponseDto) => void;
  }

  let { user, onClose }: Props = $props();

  const handleRestoreUser = async () => {
    try {
      const result = await restoreUserAdmin({ id: user.id });
      onClose(result);
    } catch (error) {
      handleError(error, $t('errors.unable_to_restore_user'));
    }
  };
</script>

<Modal title={$t('restore_user')} {onClose} icon={mdiDeleteRestore} size="small">
  <ModalBody>
    <p>
      <FormatMessage key="admin.user_restore_description" values={{ user: user.name }}>
        {#snippet children({ message })}
          <b>{message}</b>
        {/snippet}
      </FormatMessage>
    </p>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>
        {$t('cancel')}
      </Button>
      <Button shape="round" color="primary" fullWidth onclick={() => handleRestoreUser()}>
        {$t('restore')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
