<script lang="ts">
  import { copyToClipboard } from '$lib/utils';
  import { BasicModal, Code, IconButton, Text } from '@immich/ui';
  import { mdiCheck, mdiContentCopy } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
    newPassword: string;
  };

  const { onClose, newPassword }: Props = $props();
</script>

<BasicModal title={$t('password_reset_success')} icon={mdiCheck} {onClose} size="small" closeText={$t('done')}>
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
</BasicModal>
