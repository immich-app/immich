<script lang="ts">
  import { copyToClipboard } from '$lib/utils';
  import { Button, Code, IconButton, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { mdiCheck, mdiContentCopy } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
    newPassword: string;
  };

  const { onClose, newPassword }: Props = $props();
</script>

<Modal
  title={$t('password_reset_success')}
  icon={mdiCheck}
  onClose={() => onClose()}
  size="small"
  class="bg-light text-dark"
>
  <ModalBody>
    <div class="flex flex-col gap-4">
      <Text>{$t('admin.user_password_has_been_reset')}</Text>

      <div class="flex justify-center gap-2 items-center">
        <Code color="primary">{newPassword}</Code>
        <IconButton
          icon={mdiContentCopy}
          shape="round"
          color="secondary"
          variant="ghost"
          onclick={() => copyToClipboard(newPassword)}
          title={$t('copy_password')}
          aria-label={$t('copy_password')}
        />
      </div>

      <Text>{$t('admin.user_password_reset_description')}</Text>
    </div>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-3 w-full">
      <Button shape="round" color="primary" fullWidth onclick={() => onClose()}>
        {$t('done')}
      </Button>
    </div>
  </ModalFooter>
</Modal>
