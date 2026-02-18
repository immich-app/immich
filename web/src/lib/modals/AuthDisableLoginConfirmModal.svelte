<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { ConfirmModal } from '@immich/ui';
  import { mdiCancel } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (confirmed?: boolean) => void;
  };

  let { onClose }: Props = $props();
</script>

<ConfirmModal title={$t('admin.disable_login')} icon={mdiCancel} size="small" {onClose}>
  {#snippet prompt()}
    <div class="flex flex-col gap-4 text-center">
      <p>{$t('admin.authentication_settings_disable_all')}</p>
      <p>
        <FormatMessage key="admin.authentication_settings_reenable">
          {#snippet children({ message })}
            <a
              href="https://docs.immich.app/administration/server-commands"
              rel="noreferrer"
              target="_blank"
              class="underline"
            >
              {message}
            </a>
          {/snippet}
        </FormatMessage>
      </p>
    </div>
  {/snippet}
</ConfirmModal>
