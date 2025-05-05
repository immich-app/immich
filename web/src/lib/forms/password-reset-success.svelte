<script lang="ts">
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import { copyToClipboard } from '$lib/utils';
  import { Code, IconButton, Text } from '@immich/ui';
  import { mdiContentCopy } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
    newPassword: string;
  };

  const { onClose, newPassword }: Props = $props();
</script>

<ConfirmDialog
  title={$t('password_reset_success')}
  confirmText={$t('done')}
  {onClose}
  hideCancelButton={true}
  confirmColor="success"
>
  {#snippet promptSnippet()}
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
  {/snippet}
</ConfirmDialog>
